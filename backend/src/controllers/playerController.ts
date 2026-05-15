import { Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';

const getPlayers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const players = await prisma.user.findMany({
      where: { role: 'player' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        battingStyle: true,
        bowlingStyle: true,
        approved: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(toSnake(players));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const approvePlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: req.params.id as string },
      data: { approved: true },
    });
    res.json({ message: 'Player approved' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * Compute extended career stats (50s, 100s, bowling avg, best figures)
 * from individual match scores. Called by both journey endpoints.
 */
async function computeExtendedStats(playerId: string) {
  // Get all individual match scores for this player
  const allScores = await prisma.playerScore.findMany({
    where: { playerId },
    select: {
      runsScored: true,
      ballsFaced: true,
      fours: true,
      sixes: true,
      wicketsTaken: true,
      runsConceded: true,
      oversBowled: true,
      catches: true,
      isOut: true,
    },
  });

  // Aggregate stats
  let totalMatches = allScores.length;
  let totalRuns = 0;
  let totalBalls = 0;
  let totalFours = 0;
  let totalSixes = 0;
  let totalWickets = 0;
  let totalCatches = 0;
  let totalOvers = 0;
  let totalRunsConceded = 0;
  let highestScore = 0;
  let fifties = 0;
  let hundreds = 0;
  let timesOut = 0;

  // Best bowling: most wickets in a match, then fewest runs
  let bestBowlingWickets = 0;
  let bestBowlingRuns = 0;

  for (const s of allScores) {
    totalRuns += s.runsScored;
    totalBalls += s.ballsFaced;
    totalFours += s.fours;
    totalSixes += s.sixes;
    totalWickets += s.wicketsTaken;
    totalCatches += s.catches;
    totalOvers += s.oversBowled;
    totalRunsConceded += s.runsConceded;

    if (s.runsScored > highestScore) highestScore = s.runsScored;
    if (s.runsScored >= 100) hundreds++;
    else if (s.runsScored >= 50) fifties++;
    if (s.isOut) timesOut++;

    // Best bowling figures (highest wickets, lowest runs as tiebreaker)
    if (s.wicketsTaken > bestBowlingWickets ||
        (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
      bestBowlingWickets = s.wicketsTaken;
      bestBowlingRuns = s.runsConceded;
    }
  }

  const strikeRate = totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0';
  const battingAverage = timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0');
  const bowlingEconomy = totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0';
  const bowlingAverage = totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0';
  const bestBowling = totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-';

  return {
    total_matches: totalMatches,
    total_runs: totalRuns,
    highest_score: highestScore,
    total_balls_faced: totalBalls,
    total_fours: totalFours,
    total_sixes: totalSixes,
    fifties,
    hundreds,
    total_wickets: totalWickets,
    total_catches: totalCatches,
    strike_rate: strikeRate,
    batting_average: battingAverage,
    total_overs_bowled: totalOvers,
    total_runs_conceded: totalRunsConceded,
    bowling_economy: bowlingEconomy,
    bowling_average: bowlingAverage,
    best_bowling: bestBowling,
  };
}

const getPlayerJourney = async (req: AuthRequest, res: Response): Promise<void> => {
  const playerId = req.params.id as string;
  try {
    // Primary: registered_players table (canonical source post identity-split)
    // Fallback: users table for legacy user IDs
    let playerInfo: {
      id: string; name: string; email?: string | null;
      battingStyle?: string | null; bowlingStyle?: string | null;
      phone?: string | null; photoUrl?: string | null;
    } | null = await prisma.registeredPlayer.findUnique({
      where: { id: playerId },
      select: { id: true, name: true, email: true, battingStyle: true, bowlingStyle: true, phone: true, photoUrl: true },
    });

    if (!playerInfo) {
      playerInfo = await prisma.user.findUnique({
        where: { id: playerId },
        select: { id: true, name: true, email: true, battingStyle: true, bowlingStyle: true, phone: true, photoUrl: true },
      });
    }

    const [, matches] = await Promise.all([
      Promise.resolve(playerInfo),
      prisma.playerScore.findMany({
        where: { playerId },
        include: {
          match: {
            select: {
              team1Name: true,
              team2Name: true,
              matchDate: true,
              status: true,
              team1Score: true,
              team1Wickets: true,
              team2Score: true,
              team2Wickets: true,
              venue: true,
              winner: true,
            },
          },
        },
        orderBy: { match: { matchDate: 'desc' } },
      }),
    ]);
    if (!playerInfo) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    const user = playerInfo;

    // Compute stats from already-fetched matches — no extra DB round trip
    const careerStats = (() => {
      let totalMatches = matches.length;
      let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0;
      let totalWickets = 0, totalCatches = 0, totalOvers = 0, totalRunsConceded = 0;
      let highestScore = 0, fifties = 0, hundreds = 0, timesOut = 0;
      let bestBowlingWickets = 0, bestBowlingRuns = 0;
      for (const s of matches) {
        totalRuns += s.runsScored; totalBalls += s.ballsFaced;
        totalFours += s.fours; totalSixes += s.sixes;
        totalWickets += s.wicketsTaken; totalCatches += s.catches;
        totalOvers += s.oversBowled; totalRunsConceded += s.runsConceded;
        if (s.runsScored > highestScore) highestScore = s.runsScored;
        if (s.runsScored >= 100) hundreds++; else if (s.runsScored >= 50) fifties++;
        if (s.isOut) timesOut++;
        if (s.wicketsTaken > bestBowlingWickets ||
            (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
          bestBowlingWickets = s.wicketsTaken; bestBowlingRuns = s.runsConceded;
        }
      }
      return {
        total_matches: totalMatches, total_runs: totalRuns, highest_score: highestScore,
        total_balls_faced: totalBalls, total_fours: totalFours, total_sixes: totalSixes,
        fifties, hundreds, total_wickets: totalWickets, total_catches: totalCatches,
        strike_rate: totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0',
        batting_average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0'),
        total_overs_bowled: totalOvers, total_runs_conceded: totalRunsConceded,
        bowling_economy: totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0',
        bowling_average: totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0',
        best_bowling: totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-',
      };
    })();

    res.json(toSnake({
      player: user,
      career_stats: careerStats,
      matches: matches.map((m) => ({
        ...m,
        team1_name: m.match.team1Name,
        team2_name: m.match.team2Name,
        match_date: m.match.matchDate,
        match_status: m.match.status,
        team1_score: m.match.team1Score,
        team1_wickets: m.match.team1Wickets,
        team2_score: m.match.team2Score,
        team2_wickets: m.match.team2Wickets,
        venue: m.match.venue,
        winner: m.match.winner,
      })),
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getPlayerJourneyByName = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name } = req.query as { name?: string };
  if (!name) {
    res.status(400).json({ error: 'Name parameter required' });
    return;
  }

  try {
    // Primary: registered_players (canonical source post identity-split)
    const registeredPlayer = await prisma.registeredPlayer.findFirst({
      where: { name: { contains: name, mode: 'insensitive' } },
      select: { id: true, name: true, email: true, battingStyle: true, bowlingStyle: true, phone: true, photoUrl: true },
    });

    // Fallback: users table
    const user = registeredPlayer ?? await prisma.user.findFirst({
      where: { name: { contains: name, mode: 'insensitive' }, role: 'player' },
      select: { id: true, name: true, email: true, battingStyle: true, bowlingStyle: true, phone: true, photoUrl: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const matches = await prisma.playerScore.findMany({
      where: { playerId: user.id },
      include: {
        match: {
          select: {
            team1Name: true,
            team2Name: true,
            matchDate: true,
            status: true,
            team1Score: true,
            team1Wickets: true,
            team2Score: true,
            team2Wickets: true,
            venue: true,
            winner: true,
          },
        },
      },
      orderBy: { match: { matchDate: 'desc' } },
    });

    // Compute stats from already-fetched matches — no extra DB round trip
    const careerStats = (() => {
      let totalMatches = matches.length;
      let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0;
      let totalWickets = 0, totalCatches = 0, totalOvers = 0, totalRunsConceded = 0;
      let highestScore = 0, fifties = 0, hundreds = 0, timesOut = 0;
      let bestBowlingWickets = 0, bestBowlingRuns = 0;
      for (const s of matches) {
        totalRuns += s.runsScored; totalBalls += s.ballsFaced;
        totalFours += s.fours; totalSixes += s.sixes;
        totalWickets += s.wicketsTaken; totalCatches += s.catches;
        totalOvers += s.oversBowled; totalRunsConceded += s.runsConceded;
        if (s.runsScored > highestScore) highestScore = s.runsScored;
        if (s.runsScored >= 100) hundreds++; else if (s.runsScored >= 50) fifties++;
        if (s.isOut) timesOut++;
        if (s.wicketsTaken > bestBowlingWickets ||
            (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
          bestBowlingWickets = s.wicketsTaken; bestBowlingRuns = s.runsConceded;
        }
      }
      return {
        total_matches: totalMatches, total_runs: totalRuns, highest_score: highestScore,
        total_balls_faced: totalBalls, total_fours: totalFours, total_sixes: totalSixes,
        fifties, hundreds, total_wickets: totalWickets, total_catches: totalCatches,
        strike_rate: totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0',
        batting_average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0'),
        total_overs_bowled: totalOvers, total_runs_conceded: totalRunsConceded,
        bowling_economy: totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0',
        bowling_average: totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0',
        best_bowling: totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-',
      };
    })();

    res.json(toSnake({
      player: user,
      career_stats: careerStats,
      matches: matches.map((m) => ({
        ...m,
        team1_name: m.match.team1Name,
        team2_name: m.match.team2Name,
        match_date: m.match.matchDate,
        match_status: m.match.status,
        team1_score: m.match.team1Score,
        team1_wickets: m.match.team1Wickets,
        team2_score: m.match.team2Score,
        team2_wickets: m.match.team2Wickets,
        venue: m.match.venue,
        winner: m.match.winner,
      })),
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/players/me/profile
 * Returns the logged-in player's full profile:
 *   - user account fields
 *   - linked RegisteredPlayer record (matched by email or name)
 *   - career stats
 *   - last 5 match performances
 *   - upcoming matches
 *   - active/upcoming tournaments
 */
const getMyProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const userId = req.user.id;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        photoUrl: true,
        battingStyle: true,
        bowlingStyle: true,
        dateOfBirth: true,
        approved: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Run all independent queries in parallel
    const [allScores, recentScores, upcomingMatches, tournaments, registeredPlayerByEmail] = await Promise.all([
      // All scores for career stats computation
      prisma.playerScore.findMany({
        where: { playerId: userId },
        select: {
          runsScored: true,
          ballsFaced: true,
          fours: true,
          sixes: true,
          wicketsTaken: true,
          runsConceded: true,
          oversBowled: true,
          catches: true,
          isOut: true,
        },
      }),
      // Recent 10 scores with match info
      prisma.playerScore.findMany({
        where: { playerId: userId },
        include: {
          match: {
            select: {
              id: true,
              team1Name: true,
              team2Name: true,
              matchDate: true,
              status: true,
              team1Score: true,
              team1Wickets: true,
              team2Score: true,
              team2Wickets: true,
              venue: true,
              winner: true,
              tournamentId: true,
            },
          },
        },
        orderBy: { match: { matchDate: 'desc' } },
        take: 10,
      }),
      // Upcoming matches
      prisma.match.findMany({
        where: { status: 'upcoming', matchDate: { gte: new Date() } },
        orderBy: { matchDate: 'asc' },
        take: 5,
        select: {
          id: true,
          team1Name: true,
          team2Name: true,
          matchDate: true,
          venue: true,
          totalOvers: true,
          matchType: true,
          tournamentId: true,
        },
      }),
      // Active & upcoming tournaments
      prisma.tournament.findMany({
        where: { OR: [{ status: 'active' }, { status: 'upcoming' }] },
        orderBy: { startDate: 'asc' },
        take: 5,
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          startDate: true,
          endDate: true,
          venue: true,
          organizer: true,
          overs: true,
        },
      }),
      // RegisteredPlayer by email
      user.email
        ? prisma.registeredPlayer.findFirst({ where: { email: user.email } })
        : Promise.resolve(null),
    ]);

    // Fall back to name match if email lookup found nothing
    const registeredPlayer = registeredPlayerByEmail
      ?? await prisma.registeredPlayer.findFirst({
        where: { name: { equals: user.name, mode: 'insensitive' } },
      });

    // Compute career stats from the already-fetched allScores
    let totalMatches = allScores.length;
    let totalRuns = 0, totalBalls = 0, totalFours = 0, totalSixes = 0;
    let totalWickets = 0, totalCatches = 0, totalOvers = 0, totalRunsConceded = 0;
    let highestScore = 0, fifties = 0, hundreds = 0, timesOut = 0;
    let bestBowlingWickets = 0, bestBowlingRuns = 0;

    for (const s of allScores) {
      totalRuns += s.runsScored;
      totalBalls += s.ballsFaced;
      totalFours += s.fours;
      totalSixes += s.sixes;
      totalWickets += s.wicketsTaken;
      totalCatches += s.catches;
      totalOvers += s.oversBowled;
      totalRunsConceded += s.runsConceded;
      if (s.runsScored > highestScore) highestScore = s.runsScored;
      if (s.runsScored >= 100) hundreds++;
      else if (s.runsScored >= 50) fifties++;
      if (s.isOut) timesOut++;
      if (s.wicketsTaken > bestBowlingWickets ||
          (s.wicketsTaken === bestBowlingWickets && s.runsConceded < bestBowlingRuns)) {
        bestBowlingWickets = s.wicketsTaken;
        bestBowlingRuns = s.runsConceded;
      }
    }

    const careerStats = {
      total_matches: totalMatches,
      total_runs: totalRuns,
      highest_score: highestScore,
      total_balls_faced: totalBalls,
      total_fours: totalFours,
      total_sixes: totalSixes,
      fifties,
      hundreds,
      total_wickets: totalWickets,
      total_catches: totalCatches,
      strike_rate: totalBalls > 0 ? ((totalRuns * 100) / totalBalls).toFixed(2) : '0',
      batting_average: timesOut > 0 ? (totalRuns / timesOut).toFixed(2) : (totalRuns > 0 ? totalRuns.toFixed(2) : '0'),
      total_overs_bowled: totalOvers,
      total_runs_conceded: totalRunsConceded,
      bowling_economy: totalOvers > 0 ? (totalRunsConceded / totalOvers).toFixed(2) : '0',
      bowling_average: totalWickets > 0 ? (totalRunsConceded / totalWickets).toFixed(2) : '0',
      best_bowling: totalWickets > 0 ? `${bestBowlingWickets}/${bestBowlingRuns}` : '-',
    };

    res.json(toSnake({
      user,
      registered_player: registeredPlayer,
      career_stats: careerStats,
      recent_scores: recentScores.map((s) => ({
        id: s.id,
        match_id: s.matchId,
        player_id: s.playerId,
        team: s.team,
        runs_scored: s.runsScored,
        balls_faced: s.ballsFaced,
        fours: s.fours,
        sixes: s.sixes,
        is_out: s.isOut,
        out_type: s.outType,
        overs_bowled: s.oversBowled,
        runs_conceded: s.runsConceded,
        wickets_taken: s.wicketsTaken,
        catches: s.catches,
        team1_name: s.match.team1Name,
        team2_name: s.match.team2Name,
        match_date: s.match.matchDate,
        match_status: s.match.status,
        team1_score: s.match.team1Score,
        team1_wickets: s.match.team1Wickets,
        team2_score: s.match.team2Score,
        team2_wickets: s.match.team2Wickets,
        venue: s.match.venue,
        winner: s.match.winner,
        tournament_id: s.match.tournamentId,
      })),
      upcoming_matches: upcomingMatches,
      tournaments,
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/players/all
 * Returns all users with role='player' including basic info — for player browsing.
 */
const getAllPlayers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const players = await prisma.user.findMany({
      where: { role: 'player' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        battingStyle: true,
        bowlingStyle: true,
        photoUrl: true,
        approved: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    // Extract registered player IDs from temp emails (player_<cuid>@temp.com)
    const tempIdMap = new Map<string, typeof players[0]>();
    const realEmailMap = new Map<string, typeof players[0]>();
    for (const p of players) {
      const tempMatch = p.email.match(/^player_([a-z0-9]+)@temp\.com$/);
      if (tempMatch) {
        tempIdMap.set(tempMatch[1], p);
      } else {
        realEmailMap.set(p.email.toLowerCase(), p);
      }
    }

    // Batch-fetch registered players by id (temp email users) and by email (real users)
    const [regById, regByRealEmail] = await Promise.all([
      tempIdMap.size > 0
        ? prisma.registeredPlayer.findMany({
            where: { id: { in: [...tempIdMap.keys()] } },
            select: { id: true, photoUrl: true },
          })
        : Promise.resolve([]),
      realEmailMap.size > 0
        ? prisma.registeredPlayer.findMany({
            where: { email: { in: [...realEmailMap.keys()] } },
            select: { email: true, photoUrl: true },
          })
        : Promise.resolve([]),
    ]);

    const photoByRegId = new Map(regById.map((r) => [r.id, r.photoUrl]));
    const photoByEmail = new Map(regByRealEmail.map((r) => [r.email?.toLowerCase() ?? '', r.photoUrl]));

    // Deduplicate by name (case-insensitive), keeping the row with the lowest id
    const seen = new Set<string>();
    const unique = players
      .filter((p) => {
        const key = p.name.toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((p) => {
        const tempMatch = p.email.match(/^player_([a-z0-9]+)@temp\.com$/);
        const regId = tempMatch ? tempMatch[1] : null;
        const fallbackPhoto = regId !== null
          ? (photoByRegId.get(regId) ?? null)
          : (photoByEmail.get(p.email.toLowerCase()) ?? null);
        return { ...p, photoUrl: p.photoUrl ?? fallbackPhoto };
      });

    res.json(toSnake(unique));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getTopPlayers = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get top run scorers
    const topRunScorers = await prisma.$queryRaw`
      SELECT 
        rp.id as player_id,
        rp.name as player_name,
        COUNT(DISTINCT b.match_id) as matches_played,
        COALESCE(SUM(b.runs), 0) as total_runs
      FROM registered_players rp
      LEFT JOIN batsmen b ON rp.id = b.player_id
      WHERE rp.linked_user_id IS NOT NULL
      GROUP BY rp.id, rp.name
      ORDER BY total_runs DESC
      LIMIT 5
    `;

    // Get top wicket takers
    const topWicketTakers = await prisma.$queryRaw`
      SELECT 
        rp.id as player_id,
        rp.name as player_name,
        COUNT(DISTINCT b.match_id) as matches_played,
        COALESCE(SUM(b.wickets), 0) as total_wickets
      FROM registered_players rp
      LEFT JOIN bowlers b ON rp.id = b.player_id
      WHERE rp.linked_user_id IS NOT NULL
      GROUP BY rp.id, rp.name
      ORDER BY total_wickets DESC
      LIMIT 5
    `;

    res.json({
      top_run_scorers: topRunScorers,
      top_wicket_takers: topWicketTakers,
    });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const createPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, phone, date_of_birth, batting_style, bowling_style, playing_role } = req.body;
  try {
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'player',
        phone: phone || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        battingStyle: batting_style || null,
        bowlingStyle: bowling_style || null,
        approved: false,
        userRoles: {
          create: [{ role: 'player' }],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        battingStyle: true,
        bowlingStyle: true,
        approved: true,
        createdAt: true,
      },
    });

    res.status(201).json(toSnake(user));
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    console.error('Create player error:', err.message);
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const updatePlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, phone, date_of_birth, batting_style, bowling_style, playing_role } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(date_of_birth && { dateOfBirth: new Date(date_of_birth) }),
        ...(batting_style !== undefined && { battingStyle: batting_style || null }),
        ...(bowling_style !== undefined && { bowlingStyle: bowling_style || null }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        battingStyle: true,
        bowlingStyle: true,
        approved: true,
        createdAt: true,
      },
    });

    res.json(toSnake(user));
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error('Update player error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const deletePlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'Player deleted successfully' });
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error('Delete player error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export default {
  getPlayers,
  approvePlayer,
  getPlayerJourney,
  getPlayerJourneyByName,
  getMyProfile,
  getAllPlayers,
  getTopPlayers,
  createPlayer,
  updatePlayer,
  deletePlayer,
};
