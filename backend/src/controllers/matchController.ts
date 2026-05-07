import { Request, Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';

const getLiveMatches = async (_req: Request, res: Response): Promise<void> => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'live' },
      include: {
        creator: {
          select: { name: true },
        },
      },
      orderBy: { matchDate: 'desc' },
    });

    const teamNames = [...new Set(matches.flatMap((m) => [m.team1Name, m.team2Name]))];
    const teams = await prisma.team.findMany({
      where: { teamName: { in: teamNames } },
      select: { teamName: true, logoUrl: true },
    });
    const logoMap = new Map(teams.map((t) => [t.teamName, t.logoUrl]));

    const enrichedMatches = matches.map((m) => ({
      ...m,
      created_by_name: m.creator?.name,
      team1_logo_url: logoMap.get(m.team1Name) ?? null,
      team2_logo_url: logoMap.get(m.team2Name) ?? null,
    }));

    res.json(toSnake(enrichedMatches));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getMatches = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, limit } = req.query as { status?: string; limit?: string };
  // Completed matches can be huge — default cap to 50 unless overridden
  const take = limit
    ? parseInt(limit)
    : status === 'completed' ? 50 : undefined;
  try {
    const matches = await prisma.match.findMany({
      where: status ? { status } : undefined,
      include: {
        creator: {
          select: { name: true },
        },
      },
      orderBy: { matchDate: 'desc' },
      ...(take !== undefined && { take }),
    });

    const teamNames = [...new Set(matches.flatMap((m) => [m.team1Name, m.team2Name]))];
    const teams = await prisma.team.findMany({
      where: { teamName: { in: teamNames } },
      select: { teamName: true, logoUrl: true },
    });
    const logoMap = new Map(teams.map((t) => [t.teamName, t.logoUrl]));

    const enrichedMatches = matches.map((m) => ({
      ...m,
      created_by_name: m.creator?.name,
      team1_logo_url: logoMap.get(m.team1Name) ?? null,
      team2_logo_url: logoMap.get(m.team2Name) ?? null,
    }));

    res.json(toSnake(enrichedMatches));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getMatchById = async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(req.params.id as string) },
      include: {
        creator: { select: { name: true } },
        matchPlayers: {
          include: {
            player: {
              select: { name: true, battingStyle: true, bowlingStyle: true },
            },
          },
          orderBy: [{ team: 'asc' }, { player: { name: 'asc' } }],
        },
        playerScores: {
          include: {
            player: { select: { name: true } },
          },
          orderBy: [{ team: 'asc' }, { runsScored: 'desc' }],
        },
      },
    });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const team1 = await prisma.team.findFirst({
      where: { teamName: match.team1Name },
      select: { logoUrl: true, _count: { select: { teamPlayers: true } } },
    });
    const team2 = await prisma.team.findFirst({
      where: { teamName: match.team2Name },
      select: { logoUrl: true, _count: { select: { teamPlayers: true } } },
    });

    res.json(toSnake({
      ...match,
      created_by_name: match.creator?.name,
      team1_logo_url: team1?.logoUrl,
      team2_logo_url: team2?.logoUrl,
      team1_player_count: team1?._count?.teamPlayers ?? 0,
      team2_player_count: team2?._count?.teamPlayers ?? 0,
      players: (() => {
        // Dedupe match players by name per team to prevent duplicate "yet to bat" entries
        const seenPerTeam = new Map<number, Set<string>>();
        return match.matchPlayers
          .map((mp) => ({
            id: mp.id,
            match_id: mp.matchId,
            player_id: mp.playerId,
            team: mp.team,
            status: mp.status,
            name: mp.player?.name,
            batting_style: mp.player?.battingStyle,
            bowling_style: mp.player?.bowlingStyle,
            phone: (mp.player as Record<string, unknown>)?.phone,
          }))
          .filter((p) => {
            const teamKey = p.team ?? 0;
            const nameKey = (p.name ?? '').toLowerCase().trim();
            if (!nameKey) return false;
            let seen = seenPerTeam.get(teamKey);
            if (!seen) { seen = new Set(); seenPerTeam.set(teamKey, seen); }
            if (seen.has(nameKey)) return false;
            seen.add(nameKey);
            return true;
          });
      })(),
      scores: match.playerScores.map((ps) => ({
        id: ps.id,
        match_id: ps.matchId,
        player_id: ps.playerId,
        team: ps.team,
        name: ps.player?.name,
        runs_scored: ps.runsScored,
        balls_faced: ps.ballsFaced,
        fours: ps.fours,
        sixes: ps.sixes,
        is_out: ps.isOut,
        out_type: ps.outType,
        overs_bowled: ps.oversBowled,
        runs_conceded: ps.runsConceded,
        wickets_taken: ps.wicketsTaken,
        maidens: ps.maidens,
        catches: ps.catches,
        run_outs: ps.runOuts,
      })),
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { team1_name, team2_name, venue, total_overs, match_date, tournament_id, match_type, balls_per_over, umpire } = req.body;
  try {
    const match = await prisma.match.create({
      data: {
        team1Name: team1_name,
        team2Name: team2_name,
        venue: venue || null,
        totalOvers: total_overs || 20,
        matchDate: new Date(match_date),
        createdBy: req.user.id,
        tournamentId: tournament_id || null,
        matchType: match_type || 'T20',
        ballsPerOver: balls_per_over || 6,
        umpire: umpire || null,
      },
    });
    res.status(201).json(toSnake(match));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updateMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, toss_winner, toss_decision, winner, current_innings, umpire, player_of_match } = req.body;
  try {
    const data: Record<string, unknown> = {};
    if (status) data.status = status;
    if (toss_winner) data.tossWinner = toss_winner;
    if (toss_decision) data.tossDecision = toss_decision;
    if (winner) data.winner = winner;
    if (current_innings !== undefined) data.currentInnings = current_innings;
    if (umpire !== undefined) data.umpire = umpire || null;
    if (player_of_match !== undefined) data.playerOfMatch = player_of_match || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const match = await prisma.match.update({
      where: { id: parseInt(req.params.id as string) },
      data,
    });
    // Auto-update tournament standings when match completes
    if (status === 'completed' && match.tournamentId) {
      try {
        await updateTournamentStandings(match.tournamentId);
      } catch (_e) {
      }
    }

    res.json(toSnake(match));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * Recalculate tournament standings (W/L/NR/Pts/NRR) for all teams.
 * Called automatically when a match in the tournament completes.
 */
async function updateTournamentStandings(tournamentId: number): Promise<void> {
  // Get all completed matches in this tournament
  const matches = await prisma.match.findMany({
    where: { tournamentId, status: 'completed' },
  });

  // Get all teams in tournament
  const tournamentTeams = await prisma.tournamentTeam.findMany({
    where: { tournamentId },
    include: { team: true },
  });

  // Reset all team stats
  const teamStats = new Map<number, {
    played: number;
    won: number;
    lost: number;
    noResult: number;
    runsFor: number;
    oversFor: number;
    runsAgainst: number;
    oversAgainst: number;
  }>();

  for (const tt of tournamentTeams) {
    teamStats.set(tt.teamId, {
      played: 0, won: 0, lost: 0, noResult: 0,
      runsFor: 0, oversFor: 0, runsAgainst: 0, oversAgainst: 0,
    });
  }

  // Tally from matches
  for (const m of matches) {
    const t1 = tournamentTeams.find((tt) => tt.team.teamName === m.team1Name);
    const t2 = tournamentTeams.find((tt) => tt.team.teamName === m.team2Name);
    if (!t1 || !t2) continue;

    const s1 = teamStats.get(t1.teamId)!;
    const s2 = teamStats.get(t2.teamId)!;

    s1.played++; s2.played++;

    // Use totalOvers as fallback if a team was bowled out (NRR uses allotted overs in that case)
    const t1Overs = m.team1Overs > 0 ? m.team1Overs : m.totalOvers;
    const t2Overs = m.team2Overs > 0 ? m.team2Overs : m.totalOvers;

    s1.runsFor += m.team1Score;
    s1.oversFor += t1Overs;
    s1.runsAgainst += m.team2Score;
    s1.oversAgainst += t2Overs;

    s2.runsFor += m.team2Score;
    s2.oversFor += t2Overs;
    s2.runsAgainst += m.team1Score;
    s2.oversAgainst += t1Overs;

    if (!m.winner || m.winner === 'Abandoned' || m.winner === 'Draw' || m.winner === 'No Result') {
      s1.noResult++; s2.noResult++;
    } else if (m.winner === m.team1Name) {
      s1.won++; s2.lost++;
    } else if (m.winner === m.team2Name) {
      s2.won++; s1.lost++;
    }
  }

  // Update each team's standings in parallel
  await Promise.all(tournamentTeams.map((tt) => {
    const s = teamStats.get(tt.teamId)!;
    // Points: 2 for win, 1 for no result, 0 for loss
    const points = s.won * 2 + s.noResult * 1;
    // NRR = (runs scored / overs faced) - (runs conceded / overs bowled)
    const runRateFor = s.oversFor > 0 ? s.runsFor / s.oversFor : 0;
    const runRateAgainst = s.oversAgainst > 0 ? s.runsAgainst / s.oversAgainst : 0;
    const nrr = runRateFor - runRateAgainst;

    return prisma.tournamentTeam.update({
      where: { id: tt.id },
      data: {
        played: s.played,
        won: s.won,
        lost: s.lost,
        noResult: s.noResult,
        points,
        runsFor: s.runsFor,
        oversFor: s.oversFor,
        runsAgainst: s.runsAgainst,
        oversAgainst: s.oversAgainst,
        nrr,
      },
    });
  }));
}

const getScorecard = async (req: Request, res: Response): Promise<void> => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: parseInt(req.params.id as string) },
    });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const batting = await prisma.playerScore.findMany({
      where: {
        matchId: parseInt(req.params.id as string),
        ballsFaced: { gt: 0 },
      },
      include: {
        player: { select: { name: true } },
      },
      orderBy: [{ team: 'asc' }, { runsScored: 'desc' }],
    });

    const bowling = await prisma.playerScore.findMany({
      where: {
        matchId: parseInt(req.params.id as string),
        oversBowled: { gt: 0 },
      },
      include: {
        player: { select: { name: true } },
      },
      orderBy: [{ team: 'asc' }, { wicketsTaken: 'desc' }],
    });

    const teams = await prisma.team.findMany({
      where: {
        teamName: {
          in: [match.team1Name, match.team2Name],
        },
      },
      select: { id: true, teamName: true },
    });

    const teamIds = teams.map((t) => t.id);

    const teamPlayers = await prisma.teamPlayer.findMany({
      where: {
        teamId: {
          in: teamIds,
        },
      },
      include: {
        player: {
          select: {
            name: true,
          },
        },
      },
    });

    const playerRoleMap = new Map(
      teamPlayers.map((tp) => [tp.player.name.toLowerCase(), {
        isCaptain: tp.isCaptain,
        isWicketKeeper: tp.isWicketKeeper,
        teamId: tp.teamId,
      }])
    );

    const flattenScore = (ps: typeof batting[number]) => {
      const playerNameLower = ps.player?.name?.toLowerCase() || '';
      const roleInfo = playerRoleMap.get(playerNameLower);
      return {
        id: ps.id,
        match_id: ps.matchId,
        player_id: ps.playerId,
        team: ps.team,
        name: ps.player?.name,
        runs_scored: ps.runsScored,
        balls_faced: ps.ballsFaced,
        fours: ps.fours,
        sixes: ps.sixes,
        is_out: ps.isOut,
        out_type: ps.outType,
        overs_bowled: ps.oversBowled,
        runs_conceded: ps.runsConceded,
        wickets_taken: ps.wicketsTaken,
        maidens: ps.maidens,
        catches: ps.catches,
        run_outs: ps.runOuts,
        is_captain: roleInfo?.isCaptain ?? false,
        is_wicket_keeper: roleInfo?.isWicketKeeper ?? false,
      };
    };
    res.json(toSnake({ match, batting: batting.map(flattenScore), bowling: bowling.map(flattenScore) }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default {
  getLiveMatches,
  getMatches,
  getMatchById,
  createMatch,
  updateMatch,
  getScorecard,
};
