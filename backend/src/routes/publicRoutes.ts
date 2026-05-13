import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import logger from '../utils/logger';

const router = Router();

// Simple in-memory cache (15 minutes)
const cache = new Map<string, { data: unknown; expiresAt: number }>();
function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  return null;
}
function setCache(key: string, data: unknown, ttlMs = 15 * 60 * 1000) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

/**
 * GET /api/public/live-matches
 * Returns currently live matches
 */
router.get('/live-matches', async (_req: Request, res: Response) => {
  try {
    const matches = await prisma.match.findMany({
      where: { status: 'live' },
      orderBy: { createdAt: 'desc' },
    });
    res.json(toSnake(matches));
  } catch (err: unknown) {
    logger.error('Public live-matches error:', err);
    res.status(500).json({ error: 'Failed to load live matches' });
  }
});

/**
 * GET /api/public/matches?status=upcoming|completed|live
 * Public match listing with optional status filter
 */
router.get('/matches', async (req: Request, res: Response) => {
  const { status, limit } = req.query as { status?: string; limit?: string };
  try {
    const matches = await prisma.match.findMany({
      where: status ? { status } : undefined,
      orderBy: { matchDate: 'desc' },
      take: limit ? parseInt(limit) : 50,
    });
    res.json(toSnake(matches));
  } catch (err: unknown) {
    logger.error('Public matches error:', err);
    res.status(500).json({ error: 'Failed to load matches' });
  }
});

/**
 * GET /api/public/matches/:id
 * Public single match detail
 */
router.get('/matches/:id', async (req: Request, res: Response) => {
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
      players: match.matchPlayers.map((mp) => ({
        id: mp.id,
        match_id: mp.matchId,
        player_id: mp.playerId,
        team: mp.team,
        status: mp.status,
        name: mp.player?.name,
        batting_style: mp.player?.battingStyle,
        bowling_style: mp.player?.bowlingStyle,
        is_captain: mp.isCaptain ?? false,
        is_wicket_keeper: mp.isWicketKeeper ?? false,
        is_playing: (mp as any).isPlaying ?? false,
      })),
    }));
  } catch (err: unknown) {
    logger.error('Public match detail error:', err);
    res.status(500).json({ error: 'Failed to load match' });
  }
});

/**
 * GET /api/public/matches/:id/scorecard
 */
router.get('/matches/:id/scorecard', async (req: Request, res: Response) => {
  try {
    const matchId = req.params.id as string;
    const [match, scores] = await Promise.all([
      prisma.match.findUnique({ where: { id: matchId } }),
      prisma.playerScore.findMany({
        where: { matchId },
        include: { player: { select: { name: true, photoUrl: true } } },
        orderBy: [{ team: 'asc' }, { runsScored: 'desc' }],
      }),
    ]);
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }
    res.json(toSnake({ ...match, scores }));
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to load scorecard' });
  }
});

/**
 * GET /api/public/matches/:id/balls?innings=1
 */
router.get('/matches/:id/balls', async (req: Request, res: Response) => {
  try {
    const { innings } = req.query as { innings?: string };
    const balls = await prisma.ball.findMany({
      where: {
        matchId:  req.params.id as string,
        isActive: true,
        ...(innings ? { innings: parseInt(innings) } : {}),
      },
      include: {
        batsman:    { select: { name: true } },
        bowler:     { select: { name: true } },
        nonStriker: { select: { name: true } },
      },
      orderBy: [{ innings: 'asc' }, { overNumber: 'asc' }, { ballNumber: 'asc' }],
    });
    res.json(toSnake(balls.map((b) => ({
      ...b,
      batsman_name:     b.batsman?.name     ?? null,
      bowler_name:      b.bowler?.name      ?? null,
      non_striker_name: b.nonStriker?.name  ?? null,
    }))));
  } catch (err: unknown) {
    res.status(500).json({ error: 'Failed to load balls' });
  }
});

/**
 * GET /api/public/top-players
 * Returns top run scorers and wicket takers across all completed matches
 */
router.get('/top-players', async (_req: Request, res: Response) => {
  const cacheKey = 'top-players';
  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    // Aggregate batting stats
    const battingRaw = await prisma.playerScore.groupBy({
      by: ['playerId'],
      _sum: { runsScored: true, ballsFaced: true, fours: true, sixes: true },
      _count: { id: true },
      orderBy: { _sum: { runsScored: 'desc' } },
      take: 10,
    });

    // Aggregate bowling stats
    const bowlingRaw = await prisma.playerScore.groupBy({
      by: ['playerId'],
      where: { wicketsTaken: { gt: 0 } },
      _sum: { wicketsTaken: true, runsConceded: true, oversBowled: true },
      _count: { id: true },
      orderBy: { _sum: { wicketsTaken: 'desc' } },
      take: 10,
    });

    const allPlayerIds = [...new Set([
      ...battingRaw.map(r => r.playerId),
      ...bowlingRaw.map(r => r.playerId),
    ])];

    const players = await prisma.registeredPlayer.findMany({
      where: { id: { in: allPlayerIds } },
      select: { id: true, name: true, photoUrl: true, battingStyle: true, bowlingStyle: true },
    });
    const playerMap = new Map(players.map(p => [p.id, p]));

    const topRunScorers = battingRaw.map(r => {
      const p = playerMap.get(r.playerId);
      const runs = r._sum.runsScored ?? 0;
      const balls = r._sum.ballsFaced ?? 0;
      return {
        player_id:    r.playerId,
        name:         p?.name         ?? 'Unknown',
        photo_url:    p?.photoUrl     ?? null,
        batting_style: p?.battingStyle ?? null,
        matches:      r._count.id,
        runs,
        fours:        r._sum.fours ?? 0,
        sixes:        r._sum.sixes ?? 0,
        strike_rate:  balls > 0 ? Math.round((runs * 100) / balls * 10) / 10 : 0,
      };
    }).filter(r => r.runs > 0);

    const topWicketTakers = bowlingRaw.map(r => {
      const p = playerMap.get(r.playerId);
      const wickets = r._sum.wicketsTaken ?? 0;
      const runs    = r._sum.runsConceded ?? 0;
      const overs   = r._sum.oversBowled  ?? 0;
      return {
        player_id:     r.playerId,
        name:          p?.name          ?? 'Unknown',
        photo_url:     p?.photoUrl      ?? null,
        bowling_style: p?.bowlingStyle  ?? null,
        matches:       r._count.id,
        wickets,
        runs_conceded: runs,
        overs_bowled:  overs,
        economy:       overs > 0 ? Math.round((runs / overs) * 100) / 100 : 0,
      };
    }).filter(r => r.wickets > 0);

    const result = { top_run_scorers: topRunScorers, top_wicket_takers: topWicketTakers };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err: unknown) {
    logger.error('Top players error:', err);
    res.status(500).json({ error: 'Failed to load top players' });
  }
});

/**
 * GET /api/public/search?q=<term>
 * Searches matches (team names, venue) and players (name)
 */
router.get('/search', async (req: Request, res: Response) => {
  const { q } = req.query as { q?: string };
  if (!q || q.trim().length < 2) {
    res.json({ matches: [], players: [] });
    return;
  }
  const term = q.trim();
  try {
    const [matches, players] = await Promise.all([
      prisma.match.findMany({
        where: {
          OR: [
            { team1Name: { contains: term, mode: 'insensitive' } },
            { team2Name: { contains: term, mode: 'insensitive' } },
            { venue:     { contains: term, mode: 'insensitive' } },
          ],
        },
        take: 10,
        orderBy: { matchDate: 'desc' },
      }),
      prisma.registeredPlayer.findMany({
        where: { name: { contains: term, mode: 'insensitive' } },
        select: { id: true, name: true, photoUrl: true, battingStyle: true, bowlingStyle: true },
        take: 10,
      }),
    ]);
    res.json(toSnake({ matches, players }));
  } catch (err: unknown) {
    logger.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

/**
 * GET /api/public/news
 * Proxies NewsAPI for South African cricket news
 */
router.get('/news', async (_req: Request, res: Response) => {
  const cacheKey = 'cricket-news';
  const cached = getCached(cacheKey);
  if (cached) {
    res.json(cached);
    return;
  }

  try {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      res.json({ articles: [] });
      return;
    }

    const url = new URL('https://newsapi.org/v2/everything');
    url.searchParams.set('q', 'cricket south africa OR proteas OR CSA cricket');
    url.searchParams.set('language', 'en');
    url.searchParams.set('sortBy', 'publishedAt');
    url.searchParams.set('pageSize', '12');
    url.searchParams.set('apiKey', apiKey);

    const response = await fetch(url.toString());
    const data = await response.json() as { status: string; articles?: unknown[] };

    if (data.status !== 'ok') {
      res.json({ articles: [] });
      return;
    }

    const articles = (data.articles ?? []).map((a: unknown) => {
      const article = a as Record<string, unknown>;
      return {
        title: article['title'],
        description: article['description'],
        url: article['url'],
        url_to_image: article['urlToImage'],
        published_at: article['publishedAt'],
        source: (article['source'] as Record<string, unknown>)?.['name'],
      };
    });

    const result = { articles };
    setCache(cacheKey, result);
    res.json(result);
  } catch (err: unknown) {
    logger.error('News API error:', err);
    res.json({ articles: [] });
  }
});

export default router;
