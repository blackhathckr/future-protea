/**
 * @fileoverview Analytics controller — real aggregations over the cricket
 * tables, replacing the mock data the web admin currently shows.
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import toSnake from '../utils/toSnake';

const ok = (res: Response, data: unknown) => res.json({ success: true, data: toSnake(data) });
const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, error: { code: `E${status}`, message } });

/** GET /analytics/overview — headline KPIs for the dashboard. */
const overview = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [
      totalMatches, liveMatches, completedMatches, upcomingMatches,
      totalTeams, totalTournaments, activeTournaments,
      totalUsers, totalPlayers, approvedPlayers,
      totalBalls, totalRunsAgg, totalWicketsAgg,
    ] = await Promise.all([
      prisma.match.count(),
      prisma.match.count({ where: { status: 'live' } }),
      prisma.match.count({ where: { status: 'completed' } }),
      prisma.match.count({ where: { status: 'upcoming' } }),
      prisma.team.count(),
      prisma.tournament.count(),
      prisma.tournament.count({ where: { status: 'in_progress' } }),
      prisma.user.count(),
      prisma.user.count({ where: { role: 'player' } }),
      prisma.user.count({ where: { role: 'player', approved: true } }),
      prisma.ball.count({ where: { isActive: true } }),
      prisma.playerScore.aggregate({ _sum: { runsScored: true } }),
      prisma.playerScore.aggregate({ _sum: { wicketsTaken: true } }),
    ]);

    const completed = Math.max(1, completedMatches);
    const avgRuns = Math.round(((totalRunsAgg._sum.runsScored ?? 0) / completed) * 10) / 10;
    const avgWickets = Math.round(((totalWicketsAgg._sum.wicketsTaken ?? 0) / completed) * 10) / 10;

    ok(res, {
      matches: { total: totalMatches, live: liveMatches, upcoming: upcomingMatches, completed: completedMatches },
      teams: { total: totalTeams },
      tournaments: { total: totalTournaments, active: activeTournaments },
      users: { total: totalUsers, players: totalPlayers, approved_players: approvedPlayers },
      activity: {
        total_balls: totalBalls,
        total_runs: totalRunsAgg._sum.runsScored ?? 0,
        total_wickets: totalWicketsAgg._sum.wicketsTaken ?? 0,
        avg_runs_per_match: avgRuns,
        avg_wickets_per_match: avgWickets,
      },
    });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to compute overview');
  }
};

/** GET /analytics/matches-trend — matches grouped by day for the last N days. */
const matchesTrend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const days = Math.min(180, Math.max(1, parseInt((req.query.days as string) || '30', 10)));
    const start = new Date(); start.setDate(start.getDate() - days);
    const matches = await prisma.match.findMany({
      where: { matchDate: { gte: start } },
      select: { matchDate: true, status: true },
      orderBy: { matchDate: 'asc' },
    });
    const bucket = new Map<string, { date: string; total: number; live: number; completed: number; upcoming: number }>();
    for (let i = 0; i <= days; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      bucket.set(key, { date: key, total: 0, live: 0, completed: 0, upcoming: 0 });
    }
    matches.forEach((m) => {
      const key = (m.matchDate ?? new Date()).toISOString().slice(0, 10);
      const row = bucket.get(key);
      if (!row) return;
      row.total++;
      if (m.status === 'live') row.live++;
      else if (m.status === 'completed') row.completed++;
      else if (m.status === 'upcoming') row.upcoming++;
    });
    ok(res, Array.from(bucket.values()));
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to compute trend');
  }
};

/** GET /analytics/top-players — real top batters & bowlers (replaces broken raw-SQL endpoint). */
const topPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt((req.query.limit as string) || '5', 10)));
    const [topRuns, topWickets] = await Promise.all([
      prisma.playerScore.groupBy({
        by: ['playerId'],
        _sum: { runsScored: true, ballsFaced: true, fours: true, sixes: true },
        _count: { _all: true },
        orderBy: { _sum: { runsScored: 'desc' } },
        take: limit,
      }),
      prisma.playerScore.groupBy({
        by: ['playerId'],
        _sum: { wicketsTaken: true, runsConceded: true, oversBowled: true },
        _count: { _all: true },
        orderBy: { _sum: { wicketsTaken: 'desc' } },
        take: limit,
      }),
    ]);
    const ids = [...new Set([...topRuns.map((t) => t.playerId), ...topWickets.map((t) => t.playerId)])].filter(Boolean) as string[];
    const players = ids.length > 0
      ? await prisma.registeredPlayer.findMany({
        where: { id: { in: ids } },
        select: { id: true, name: true, photoUrl: true },
      })
      : [];
    const playerMap = new Map(players.map((p) => [p.id, p]));
    const top_run_scorers = topRuns.map((t) => ({
      player_id: t.playerId,
      player_name: playerMap.get(t.playerId ?? '')?.name ?? 'Unknown',
      photo_url: playerMap.get(t.playerId ?? '')?.photoUrl ?? null,
      matches_played: t._count._all,
      total_runs: t._sum.runsScored ?? 0,
      fours: t._sum.fours ?? 0,
      sixes: t._sum.sixes ?? 0,
    }));
    const top_wicket_takers = topWickets.map((t) => ({
      player_id: t.playerId,
      player_name: playerMap.get(t.playerId ?? '')?.name ?? 'Unknown',
      photo_url: playerMap.get(t.playerId ?? '')?.photoUrl ?? null,
      matches_played: t._count._all,
      total_wickets: t._sum.wicketsTaken ?? 0,
      total_runs_conceded: t._sum.runsConceded ?? 0,
    }));
    ok(res, { top_run_scorers, top_wicket_takers });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to compute top players');
  }
};

/** GET /analytics/role-distribution — pie data for user-role breakdown. */
const roleDistribution = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const groups = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
    ok(res, groups.map((g) => ({ role: g.role, count: g._count._all })));
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to compute role distribution');
  }
};

/** GET /analytics/recent-activity — latest audit-log entries. */
const recentActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt((req.query.limit as string) || '15', 10)));
    const logs = await prisma.auditLog.findMany({
      include: { actor: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    ok(res, logs);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch activity');
  }
};

export default { overview, matchesTrend, topPlayers, roleDistribution, recentActivity };
