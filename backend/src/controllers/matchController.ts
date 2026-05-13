import { Request, Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

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
      where: { id: req.params.id as string },
      include: {
        creator: { select: { name: true } },
        matchPlayers: {
          include: {
            player: {
              select: { name: true, battingStyle: true, bowlingStyle: true, photoUrl: true },
            },
          },
          orderBy: [{ team: 'asc' }, { player: { name: 'asc' } }],
        },
        playerScores: {
          include: {
            player:      { select: { name: true } },
            dismissedBy: { select: { name: true } },
            fielder:     { select: { name: true } },
          },
          orderBy: [{ team: 'asc' }, { runsScored: 'desc' }],
        },
        matchInnings: {
          orderBy: { inningsNumber: 'asc' },
          select: {
            id: true, inningsNumber: true,
            totalRuns: true, totalWickets: true, totalOvers: true, totalBalls: true,
            extrasWides: true, extrasNoballs: true, extrasByes: true,
            extrasLegbyes: true, extrasPenalties: true,
            targetRuns: true, status: true,
            strikerId: true, nonStrikerId: true, currentBowlerId: true,
          },
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
        id:            ps.id,
        match_id:      ps.matchId,
        player_id:     ps.playerId,
        team:          ps.team,
        name:          ps.player?.name,
        runs_scored:   ps.runsScored,
        balls_faced:   ps.ballsFaced,
        fours:         ps.fours,
        sixes:         ps.sixes,
        is_out:        ps.isOut,
        out_type:      ps.outType,
        dismissed_by:  ps.dismissedBy?.name ?? null,
        fielder:       ps.fielder?.name     ?? null,
        overs_bowled:  ps.oversBowled,
        runs_conceded: ps.runsConceded,
        wickets_taken: ps.wicketsTaken,
        maidens:       ps.maidens,
        catches:       ps.catches,
        run_outs:      ps.runOuts,
      })),
      match_innings: match.matchInnings,
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const createMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    team1_name, team2_name, team1_id, team2_id,
    venue, total_overs, match_date, tournament_id,
    match_type, balls_per_over, umpire,
  } = req.body;
  try {
    const match = await prisma.match.create({
      data: {
        team1Name:    team1_name,
        team2Name:    team2_name,
        team1Id:      team1_id      || null,
        team2Id:      team2_id      || null,
        venue:        venue         || null,
        totalOvers:   total_overs   || 20,
        matchDate:    new Date(match_date),
        createdBy:    req.user.id,
        tournamentId: tournament_id || null,
        matchType:    match_type    || 'T20',
        ballsPerOver: balls_per_over || 6,
        umpire:       umpire        || null,
      },
    });
    res.status(201).json(toSnake(match));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updateMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    status, toss_winner, toss_decision,
    winner, winner_team_id, result_type, result_margin,
    current_innings, umpire,
    player_of_match, player_of_match_id,
  } = req.body;

  try {
    const matchId = req.params.id as string;

    const data: Record<string, unknown> = {};
    if (status                !== undefined) data.status             = status;
    if (toss_winner           !== undefined) data.tossWinner         = toss_winner         || null;
    if (toss_decision         !== undefined) data.tossDecision       = toss_decision       || null;
    if (winner                !== undefined) data.winner             = winner              || null;
    if (winner_team_id        !== undefined) data.winnerTeamId       = winner_team_id      || null;
    if (result_type           !== undefined) data.resultType         = result_type         || null;
    if (result_margin         !== undefined) data.resultMargin       = result_margin       ?? null;
    if (current_innings       !== undefined) data.currentInnings     = current_innings;
    if (umpire                !== undefined) data.umpire             = umpire              || null;
    if (player_of_match       !== undefined) data.playerOfMatch      = player_of_match     || null;
    if (player_of_match_id    !== undefined) data.playerOfMatchId    = player_of_match_id  || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const match = await prisma.match.update({
      where: { id: matchId },
      data,
    });

    // When innings switches to 2, ensure match_innings row 1 is closed
    // and innings row 2 is seeded with the target
    if (current_innings === 2) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.matchInnings.updateMany({
            where: { matchId, inningsNumber: 1, status: 'in_progress' },
            data:  { status: 'completed', endedAt: new Date() },
          });
          // target = team1 total + 1
          const target = match.team1Score + 1;
          await tx.matchInnings.upsert({
            where: { matchId_inningsNumber: { matchId, inningsNumber: 2 } },
            create: {
              matchId,
              inningsNumber: 2,
              targetRuns:    target,
              status:        'in_progress',
              startedAt:     new Date(),
            },
            update: { targetRuns: target, status: 'in_progress' },
          });
        });
      } catch (inningsErr) {
        logger.error('match_innings transition failed (non-fatal):', inningsErr);
      }
    }

    // When match completes, close both innings and update tournament standings
    if (status === 'completed') {
      try {
        await prisma.matchInnings.updateMany({
          where: { matchId, status: 'in_progress' },
          data:  { status: 'completed', endedAt: new Date() },
        });
        if (match.tournamentId) {
          await updateTournamentStandings(match.tournamentId);
        }
      } catch (compErr) {
        logger.error('match completion side-effects failed (non-fatal):', compErr);
      }
    }

    res.json(toSnake(match));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /matches/:id/innings/:inningsNumber/setup
 * Explicitly create/open an innings row (used before first ball of an innings).
 */
const setupInnings = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId       = req.params.id           as string;
  const inningsNumber = parseInt(req.params.inningsNumber as string, 10);
  const { batting_team_id, bowling_team_id, target_runs } = req.body;
  try {
    const innings = await prisma.matchInnings.upsert({
      where: { matchId_inningsNumber: { matchId, inningsNumber } },
      create: {
        matchId,
        inningsNumber,
        battingTeamId:  batting_team_id  || null,
        bowlingTeamId:  bowling_team_id  || null,
        targetRuns:     target_runs      ?? null,
        status:         'in_progress',
        startedAt:      new Date(),
      },
      update: {
        battingTeamId:  batting_team_id  || null,
        bowlingTeamId:  bowling_team_id  || null,
        targetRuns:     target_runs      ?? null,
        status:         'in_progress',
      },
    });
    res.status(201).json(toSnake(innings));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /matches/:id/innings/:inningsNumber/end
 * Close an innings (all out / declared / overs complete).
 */
const endInnings = async (req: AuthRequest, res: Response): Promise<void> => {
  const matchId       = req.params.id           as string;
  const inningsNumber = parseInt(req.params.inningsNumber as string, 10);
  try {
    const innings = await prisma.matchInnings.update({
      where: { matchId_inningsNumber: { matchId, inningsNumber } },
      data:  { status: 'completed', endedAt: new Date() },
    });
    res.json(toSnake(innings));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * Recalculate tournament standings (W/L/NR/Pts/NRR) for all teams.
 * Called automatically when a match in the tournament completes.
 */
async function updateTournamentStandings(tournamentId: string): Promise<void> {
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
  const teamStats = new Map<string, {
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
    const matchId = req.params.id as string;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
    });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    // Parallel fetch all scorecard data
    const [batting, bowling, inningsRows, teams] = await Promise.all([
      prisma.playerScore.findMany({
        where: { matchId, ballsFaced: { gt: 0 } },
        include: {
          player:      { select: { name: true } },
          dismissedBy: { select: { name: true } },
          fielder:     { select: { name: true } },
        },
        orderBy: [{ team: 'asc' }, { runsScored: 'desc' }],
      }),
      prisma.playerScore.findMany({
        where: { matchId, oversBowled: { gt: 0 } },
        include: { player: { select: { name: true } } },
        orderBy: [{ team: 'asc' }, { wicketsTaken: 'desc' }],
      }),
      prisma.matchInnings.findMany({
        where: { matchId },
        include: {
          fallOfWickets: {
            include: {
              innings:  { select: { name: true } },
              bowler:   { select: { name: true } },
              fielder:  { select: { name: true } },
            },
            orderBy: { wicketNumber: 'asc' },
          },
        },
        orderBy: { inningsNumber: 'asc' },
      }),
      prisma.team.findMany({
        where: { teamName: { in: [match.team1Name, match.team2Name] } },
        select: { id: true, teamName: true },
      }),
    ]);

    // Build role lookup from team rosters
    const teamIds = teams.map((t) => t.id);
    const teamPlayers = await prisma.teamPlayer.findMany({
      where: { teamId: { in: teamIds } },
      include: { player: { select: { name: true } } },
    });
    const playerRoleMap = new Map(
      teamPlayers.map((tp) => [tp.player.name.toLowerCase(), {
        isCaptain:      tp.isCaptain,
        isWicketKeeper: tp.isWicketKeeper,
      }])
    );

    const flattenBatting = (ps: typeof batting[number]) => {
      const roleInfo = playerRoleMap.get(ps.player?.name?.toLowerCase() || '');
      return {
        id:               ps.id,
        match_id:         ps.matchId,
        player_id:        ps.playerId,
        team:             ps.team,
        name:             ps.player?.name,
        runs_scored:      ps.runsScored,
        balls_faced:      ps.ballsFaced,
        fours:            ps.fours,
        sixes:            ps.sixes,
        is_out:           ps.isOut,
        out_type:         ps.outType,
        dismissed_by:     ps.dismissedBy?.name ?? null,
        fielder:          ps.fielder?.name     ?? null,
        overs_bowled:     ps.oversBowled,
        runs_conceded:    ps.runsConceded,
        wickets_taken:    ps.wicketsTaken,
        maidens:          ps.maidens,
        catches:          ps.catches,
        run_outs:         ps.runOuts,
        is_captain:       roleInfo?.isCaptain      ?? false,
        is_wicket_keeper: roleInfo?.isWicketKeeper ?? false,
      };
    };

    const flattenBowling = (ps: typeof bowling[number]) => {
      const roleInfo = playerRoleMap.get(ps.player?.name?.toLowerCase() || '');
      return {
        id:               ps.id,
        match_id:         ps.matchId,
        player_id:        ps.playerId,
        team:             ps.team,
        name:             ps.player?.name,
        runs_scored:      ps.runsScored,
        balls_faced:      ps.ballsFaced,
        fours:            ps.fours,
        sixes:            ps.sixes,
        is_out:           ps.isOut,
        out_type:         ps.outType,
        overs_bowled:     ps.oversBowled,
        runs_conceded:    ps.runsConceded,
        wickets_taken:    ps.wicketsTaken,
        maidens:          ps.maidens,
        catches:          ps.catches,
        run_outs:         ps.runOuts,
        is_captain:       roleInfo?.isCaptain      ?? false,
        is_wicket_keeper: roleInfo?.isWicketKeeper ?? false,
      };
    };

    // Shape innings with extras breakdown and fall of wickets
    const inningsSummaries = inningsRows.map((inn) => ({
      innings_number:    inn.inningsNumber,
      total_runs:        inn.totalRuns,
      total_wickets:     inn.totalWickets,
      total_overs:       inn.totalOvers,
      target_runs:       inn.targetRuns,
      status:            inn.status,
      extras: {
        wides:     inn.extrasWides,
        noballs:   inn.extrasNoballs,
        byes:      inn.extrasByes,
        legbyes:   inn.extrasLegbyes,
        penalties: inn.extrasPenalties,
        total:     inn.extrasWides + inn.extrasNoballs + inn.extrasByes + inn.extrasLegbyes + inn.extrasPenalties,
      },
      fall_of_wickets: inn.fallOfWickets.map((fow) => ({
        wicket_number:  fow.wicketNumber,
        batsman_name:   (fow as typeof fow & { innings?: { name: string } | null }).innings?.name ?? null,
        dismissal_type: fow.dismissalType,
        bowler_name:    fow.bowler?.name  ?? null,
        fielder_name:   fow.fielder?.name ?? null,
        runs_at_fall:   fow.runsAtFall,
        overs_at_fall:  fow.oversAtFall,
      })),
    }));

    res.json(toSnake({
      match,
      batting:  batting.map(flattenBatting),
      bowling:  bowling.map(flattenBowling),
      innings:  inningsSummaries,
    }));
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
  setupInnings,
  endInnings,
  getScorecard,
};
