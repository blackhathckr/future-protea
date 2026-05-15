import { Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';
import supabaseStorage from '../services/supabaseStorage';

const getTournaments = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = req.query as { status?: string };
  try {
    const tournaments = await prisma.tournament.findMany({
      where: status ? { status } : undefined,
      orderBy: { startDate: 'desc' },
    });
    res.json(toSnake(tournaments));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getTournamentById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tournament = await prisma.tournament.findUnique({
      where: { id: req.params.id as string },
    });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    const teams = await prisma.tournamentTeam.findMany({
      where: { tournamentId: req.params.id as string },
      include: {
        team: {
          select: { teamName: true },
        },
      },
      orderBy: { points: 'desc' },
    });

    res.json(toSnake({
      ...tournament,
      teams: teams.map((tt) => ({
        id: tt.id,
        tournament_id: tt.tournamentId,
        team_id: tt.teamId,
        team_name: tt.team.teamName,
        group_name: tt.groupName,
        played: tt.played,
        won: tt.won,
        lost: tt.lost,
        no_result: tt.noResult,
        points: tt.points,
      })),
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const createTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, type, overs, start_date, end_date, venue, organizer } = req.body;
  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        type: type || 'T20',
        overs: overs || 20,
        startDate: start_date ? new Date(start_date) : null,
        endDate: end_date ? new Date(end_date) : null,
        venue: venue || null,
        organizer: organizer || null,
        createdBy: req.user.id,
      },
    });
    res.status(201).json(toSnake(tournament));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const addTeamToTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  const { team_id, group } = req.body;
  try {
    await prisma.tournamentTeam.create({
      data: {
        tournamentId: req.params.id as string,
        teamId: team_id,
        groupName: group || null,
      },
    });
    res.status(201).json({ message: 'Team added to tournament' });
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Team already in tournament' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const getTournamentFixtures = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fixtures = await prisma.tournamentFixture.findMany({
      where: { tournamentId: req.params.id as string },
      orderBy: { matchDate: 'asc' },
    });

    // Batch-fetch linked matches to enrich completed fixtures with score data
    const matchIds = fixtures.map((f) => f.matchId).filter((id): id is string => id !== null);
    const matches = matchIds.length > 0
      ? await prisma.match.findMany({
          where: { id: { in: matchIds } },
          select: {
            id: true,
            team1Score: true,
            team1Wickets: true,
            team1Overs: true,
            team2Score: true,
            team2Wickets: true,
            team2Overs: true,
            playerOfMatch: true,
          },
        })
      : [];
    const matchMap = new Map(matches.map((m) => [m.id, m]));

    const enriched = fixtures.map((f) => {
      const m = f.matchId ? matchMap.get(f.matchId) : undefined;
      return {
        ...f,
        team1_score: m?.team1Score ?? null,
        team1_wickets: m?.team1Wickets ?? null,
        team1_overs: m?.team1Overs ?? null,
        team2_score: m?.team2Score ?? null,
        team2_wickets: m?.team2Wickets ?? null,
        team2_overs: m?.team2Overs ?? null,
        player_of_match: m?.playerOfMatch ?? null,
      };
    });

    res.json(toSnake(enriched));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

// Convert cricket-style overs ("12.3" = 12 overs + 3 balls) to decimal overs
// (12.5) for NRR math.
const cricketOversToDecimal = (overs: number): number => {
  const whole = Math.floor(overs);
  const balls = Math.round((overs - whole) * 10);
  return whole + balls / 6;
};

const getTournamentStandings = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;

    const standings = await prisma.tournamentTeam.findMany({
      where: { tournamentId },
      include: {
        team: {
          select: { teamName: true },
        },
      },
      orderBy: [
        { groupName: 'asc' },
        { points: 'desc' },
        { won: 'desc' },
      ],
    });

    // Compute NRR per team from all completed matches in the tournament.
    // NRR = (runs scored / overs faced) − (runs conceded / overs bowled)
    const completedMatches = await prisma.match.findMany({
      where: { tournamentId, status: 'completed' },
      select: {
        team1Name: true, team2Name: true,
        team1Score: true, team1Overs: true,
        team2Score: true, team2Overs: true,
      },
    });

    const nrrByTeam = new Map<string, number>();
    for (const s of standings) {
      const name = s.team.teamName;
      let runsScored = 0;
      let oversFaced = 0;
      let runsConceded = 0;
      let oversBowled = 0;

      for (const m of completedMatches) {
        if (m.team1Name === name) {
          runsScored += m.team1Score;
          oversFaced += cricketOversToDecimal(m.team1Overs);
          runsConceded += m.team2Score;
          oversBowled += cricketOversToDecimal(m.team2Overs);
        } else if (m.team2Name === name) {
          runsScored += m.team2Score;
          oversFaced += cricketOversToDecimal(m.team2Overs);
          runsConceded += m.team1Score;
          oversBowled += cricketOversToDecimal(m.team1Overs);
        }
      }

      const scoredRate = oversFaced > 0 ? runsScored / oversFaced : 0;
      const concededRate = oversBowled > 0 ? runsConceded / oversBowled : 0;
      const nrr = oversFaced > 0 && oversBowled > 0 ? scoredRate - concededRate : 0;
      nrrByTeam.set(s.teamId, Math.round(nrr * 1000) / 1000);
    }

    const enriched = standings.map((s) => ({
      id: s.id,
      tournament_id: s.tournamentId,
      team_id: s.teamId,
      team_name: s.team.teamName,
      group_name: s.groupName,
      played: s.played,
      won: s.won,
      lost: s.lost,
      no_result: s.noResult,
      points: s.points,
      nrr: nrrByTeam.get(s.teamId) ?? 0,
    }));

    // Re-sort within group by points desc, then NRR desc.
    enriched.sort((a, b) => {
      if (a.group_name !== b.group_name) {
        return (a.group_name ?? '').localeCompare(b.group_name ?? '');
      }
      if (b.points !== a.points) return b.points - a.points;
      return b.nrr - a.nrr;
    });

    res.json(toSnake(enriched));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getTournamentStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;

    // Get all matches in this tournament
    const matches = await prisma.match.findMany({
      where: { tournamentId },
      select: { id: true },
    });
    const matchIds = matches.map((m) => m.id);

    if (matchIds.length === 0) {
      res.json(toSnake({
        top_scorers: [],
        top_wicket_takers: [],
        best_bowling: [],
        most_fours: [],
        most_sixes: [],
      }));
      return;
    }

    // Aggregate batting stats per player across all tournament matches
    const battingStats = await prisma.playerScore.groupBy({
      by: ['playerId'],
      where: { matchId: { in: matchIds } },
      _sum: {
        runsScored: true,
        ballsFaced: true,
        fours: true,
        sixes: true,
        wicketsTaken: true,
        runsConceded: true,
        oversBowled: true,
      },
      _count: { id: true },
    });

    // Get player names from registered_players (canonical source post identity-split fix)
    const playerIds = battingStats.map((b) => b.playerId);
    const players = await prisma.registeredPlayer.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, name: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p.name]));

    // Top scorers (sorted by runs)
    const topScorers = battingStats
      .map((b) => ({
        player_id: b.playerId,
        name: playerMap.get(b.playerId) || 'Unknown',
        matches: b._count.id,
        runs: b._sum.runsScored || 0,
        balls: b._sum.ballsFaced || 0,
        fours: b._sum.fours || 0,
        sixes: b._sum.sixes || 0,
        strike_rate: (b._sum.ballsFaced || 0) > 0
          ? (((b._sum.runsScored || 0) * 100) / (b._sum.ballsFaced || 1)).toFixed(2)
          : '0',
      }))
      .filter((p) => p.runs > 0)
      .sort((a, b) => b.runs - a.runs)
      .slice(0, 10);

    // Top wicket-takers (sorted by wickets, then by economy)
    const topWicketTakers = battingStats
      .map((b) => {
        const wickets = b._sum.wicketsTaken || 0;
        const runsConceded = b._sum.runsConceded || 0;
        const overs = b._sum.oversBowled || 0;
        return {
          player_id: b.playerId,
          name: playerMap.get(b.playerId) || 'Unknown',
          matches: b._count.id,
          wickets,
          runs_conceded: runsConceded,
          overs_bowled: overs,
          economy: overs > 0 ? (runsConceded / overs).toFixed(2) : '0',
          average: wickets > 0 ? (runsConceded / wickets).toFixed(2) : '0',
        };
      })
      .filter((p) => p.wickets > 0)
      .sort((a, b) => b.wickets - a.wickets)
      .slice(0, 10);

    // Best bowling figures — single match best (most wickets, fewest runs)
    const allBowlingScores = await prisma.playerScore.findMany({
      where:  { matchId: { in: matchIds }, wicketsTaken: { gt: 0 } },
      select: { playerId: true, wicketsTaken: true, runsConceded: true },
    });

    // Group by player and find their best match
    const bestByPlayer = new Map<string, { wickets: number; runs: number }>();
    for (const score of allBowlingScores) {
      const existing = bestByPlayer.get(score.playerId);
      if (!existing ||
          score.wicketsTaken > existing.wickets ||
          (score.wicketsTaken === existing.wickets && score.runsConceded < existing.runs)) {
        bestByPlayer.set(score.playerId, {
          wickets: score.wicketsTaken,
          runs: score.runsConceded,
        });
      }
    }

    const bestBowling = Array.from(bestByPlayer.entries())
      .map(([playerId, fig]) => ({
        player_id: playerId,
        name: playerMap.get(playerId) || 'Unknown',
        figures: `${fig.wickets}/${fig.runs}`,
        wickets: fig.wickets,
        runs_conceded: fig.runs,
      }))
      .sort((a, b) => b.wickets - a.wickets || a.runs_conceded - b.runs_conceded)
      .slice(0, 5);

    // Most fours / sixes
    const mostFours = topScorers.slice().sort((a, b) => b.fours - a.fours).slice(0, 5);
    const mostSixes = topScorers.slice().sort((a, b) => b.sixes - a.sixes).slice(0, 5);

    res.json(toSnake({
      top_scorers: topScorers,
      top_wicket_takers: topWicketTakers,
      best_bowling: bestBowling,
      most_fours: mostFours,
      most_sixes: mostSixes,
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const createFixture = async (req: AuthRequest, res: Response): Promise<void> => {
  const tournamentId = req.params.id as string;
  const {
    team1_name, team2_name, team1_id, team2_id,
    match_date, venue, round, group_name, match_id,
  } = req.body;
  try {
    if (!team1_name || !team2_name) {
      res.status(400).json({ error: 'team1_name and team2_name are required' });
      return;
    }
    const fixture = await prisma.tournamentFixture.create({
      data: {
        tournamentId,
        team1Name:  team1_name,
        team2Name:  team2_name,
        matchDate:  match_date ? new Date(match_date) : new Date(),
        venue:      venue      || null,
        groupName:  group_name || null,
        matchId:    match_id   || null,
      },
    });
    res.status(201).json(toSnake(fixture));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updateTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  const tournamentId = req.params.id as string;
  const { logo_url, name, type, overs, start_date, end_date, venue, organizer, status } = req.body;
  try {
    const data: Record<string, unknown> = {};
    if (logo_url !== undefined) data.logoUrl = logo_url || null;
    if (name) data.name = name;
    if (type) data.type = type;
    if (overs !== undefined) data.overs = overs;
    if (start_date !== undefined) data.startDate = start_date ? new Date(start_date) : null;
    if (end_date !== undefined) data.endDate = end_date ? new Date(end_date) : null;
    if (venue !== undefined) data.venue = venue || null;
    if (organizer !== undefined) data.organizer = organizer || null;
    if (status) data.status = status;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const tournament = await prisma.tournament.update({
      where: { id: tournamentId },
      data,
    });
    res.json(toSnake(tournament));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const uploadTournamentLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const tournamentId = req.params.id as string;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.logoUrl && tournament.logoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try { await supabaseStorage.deleteFile(tournament.logoUrl); } catch (_) {}
    }

    const fileName = `tournament_${tournamentId}_${Date.now()}`;
    const logoUrl = await supabaseStorage.uploadFile(req.file, fileName);

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { logoUrl },
    });

    res.json(toSnake(updated));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const deleteTournamentLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.logoUrl && tournament.logoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try { await supabaseStorage.deleteFile(tournament.logoUrl); } catch (_) {}
    }

    const updated = await prisma.tournament.update({
      where: { id: tournamentId },
      data: { logoUrl: null },
    });

    res.json(toSnake(updated));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const deleteTournament = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const tournamentId = req.params.id as string;
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      res.status(404).json({ error: 'Tournament not found' });
      return;
    }

    if (tournament.logoUrl && tournament.logoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try { await supabaseStorage.deleteFile(tournament.logoUrl); } catch (_) {}
    }

    await prisma.tournament.delete({
      where: { id: tournamentId },
    });

    res.json({ message: 'Tournament deleted successfully' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default {
  getTournaments,
  getTournamentById,
  createTournament,
  updateTournament,
  addTeamToTournament,
  createFixture,
  getTournamentFixtures,
  getTournamentStandings,
  getTournamentStats,
  uploadTournamentLogo,
  deleteTournamentLogo,
  deleteTournament,
};
