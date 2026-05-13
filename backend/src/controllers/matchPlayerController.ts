import { Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';

/**
 * POST /matches/:id/join
 * Body: { registered_player_id, team? }
 * Allows a logged-in user to join a match on behalf of their linked registered player.
 */
const joinMatch = async (req: AuthRequest, res: Response): Promise<void> => {
  const { registered_player_id, team } = req.body;

  if (!registered_player_id) {
    res.status(400).json({ error: 'registered_player_id is required' });
    return;
  }

  try {
    // Verify the registered player exists
    const player = await prisma.registeredPlayer.findUnique({
      where: { id: registered_player_id as string },
      select: { id: true, name: true },
    });
    if (!player) {
      res.status(404).json({ error: 'Registered player not found' });
      return;
    }

    const matchPlayer = await prisma.matchPlayer.create({
      data: {
        matchId:  req.params.id as string,
        playerId: registered_player_id as string,
        team:     team || null,
      },
    });
    res.status(201).json(toSnake(matchPlayer));
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Player already joined this match' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const getMatchPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id as string;

    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { team1Name: true, team2Name: true },
    });

    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const players = await prisma.matchPlayer.findMany({
      where: { matchId },
      include: {
        player: {
          select: {
            name: true,
            battingStyle: true,
            bowlingStyle: true,
            phone: true,
          },
        },
      },
      orderBy: [{ team: 'asc' }, { status: 'asc' }],
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
      }])
    );

    // Dedupe by name within each team. Pre-existing duplicate match_player rows
    // (created before duplicate-prevention was added) would otherwise cause the
    // same name to appear twice in the scorecard's "yet to bat" list.
    const seenPerTeam = new Map<number, Set<string>>();
    const flattenedPlayers = players
      .map((mp) => {
        const roleInfo = playerRoleMap.get(mp.player?.name?.toLowerCase() || '');
        return {
          id: mp.id,
          match_id: mp.matchId,
          player_id: mp.playerId,
          team: mp.team,
          status: mp.status,
          name: mp.player?.name,
          batting_style: mp.player?.battingStyle,
          bowling_style: mp.player?.bowlingStyle,
          is_captain: roleInfo?.isCaptain ?? false,
          is_wicket_keeper: roleInfo?.isWicketKeeper ?? false,
        };
      })
      .filter((p) => {
        const teamKey = p.team ?? 0;
        const nameKey = (p.name ?? '').toLowerCase().trim();
        if (!nameKey) return false;
        let seen = seenPerTeam.get(teamKey);
        if (!seen) {
          seen = new Set<string>();
          seenPerTeam.set(teamKey, seen);
        }
        if (seen.has(nameKey)) return false;
        seen.add(nameKey);
        return true;
      });

    res.json(toSnake(flattenedPlayers));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const approveMatchPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status, team } = req.body;
  try {
    const data: Record<string, unknown> = { status: status || 'approved' };
    if (team) data.team = team;

    const matchPlayer = await prisma.matchPlayer.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(toSnake(matchPlayer));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getApprovedPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const players = await prisma.matchPlayer.findMany({
      where: {
        matchId: req.params.id as string,
        status: 'approved',
      },
      include: {
        player: {
          select: {
            name: true,
            battingStyle: true,
            bowlingStyle: true,
          },
        },
      },
      orderBy: [{ team: 'asc' }],
    });

    const flattenedPlayers = players.map((mp) => ({
      id: mp.id,
      match_id: mp.matchId,
      player_id: mp.playerId,
      team: mp.team,
      status: mp.status,
      name: mp.player?.name,
      batting_style: mp.player?.battingStyle,
      bowling_style: mp.player?.bowlingStyle,
    }));

    res.json(toSnake(flattenedPlayers));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * POST /matches/:id/populate-players
 * Seeds match_players from the team rosters linked to this match.
 * Uses registered_player.id directly — no ghost user accounts.
 */
const populateMatchPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id as string;

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      res.status(404).json({ error: 'Match not found' });
      return;
    }

    const teamInclude = {
      teamPlayers: {
        include: {
          player: {
            select: {
              id: true, name: true,
              battingStyle: true, bowlingStyle: true,
            },
          },
        },
      },
    } as const;

    // Prefer team FK, fall back to name match
    const [team1, team2] = await Promise.all([
      match.team1Id
        ? prisma.team.findUnique({ where: { id: match.team1Id }, include: teamInclude })
        : prisma.team.findFirst({ where: { teamName: match.team1Name }, include: teamInclude }),
      match.team2Id
        ? prisma.team.findUnique({ where: { id: match.team2Id }, include: teamInclude })
        : prisma.team.findFirst({ where: { teamName: match.team2Name }, include: teamInclude }),
    ]);

    const allTeamPlayers = [
      ...(team1?.teamPlayers ?? []).map((tp) => ({ ...tp, teamNumber: 1 })),
      ...(team2?.teamPlayers ?? []).map((tp) => ({ ...tp, teamNumber: 2 })),
    ];

    // Pre-fetch existing match_player rows (by registered_player.id)
    const existingMatchPlayers = await prisma.matchPlayer.findMany({
      where: { matchId },
      include: { player: { select: { name: true } } },
    });
    const existingPlayerIds  = new Set(existingMatchPlayers.map((mp) => mp.playerId));
    const seenNamesInMatch   = new Set(
      existingMatchPlayers.map((mp) => mp.player.name.toLowerCase().trim()),
    );

    const created: string[]  = [];
    const seenInBatch        = new Set<string>();

    for (const tp of allTeamPlayers) {
      const nameKey = tp.player.name.toLowerCase().trim();
      if (seenNamesInMatch.has(nameKey) || seenInBatch.has(nameKey)) continue;
      seenInBatch.add(nameKey);

      if (!existingPlayerIds.has(tp.player.id)) {
        await prisma.matchPlayer.create({
          data: {
            matchId,
            playerId:       tp.player.id,
            team:           tp.teamNumber,
            status:         'approved',
            isCaptain:      tp.isCaptain      ?? false,
            isWicketKeeper: tp.isWicketKeeper ?? false,
          },
        });
        created.push(tp.player.id);
        seenNamesInMatch.add(nameKey);
        existingPlayerIds.add(tp.player.id);
      }
    }

    // Remove any pre-existing duplicate rows by (team, name)
    const allMatchPlayers = await prisma.matchPlayer.findMany({
      where: { matchId },
      include: { player: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });
    const seenKeys     = new Set<string>();
    const idsToDelete: string[] = [];
    for (const mp of allMatchPlayers) {
      const key = `${mp.team ?? 0}|${mp.player.name.toLowerCase().trim()}`;
      if (seenKeys.has(key)) {
        idsToDelete.push(mp.id);
      } else {
        seenKeys.add(key);
      }
    }
    if (idsToDelete.length > 0) {
      await prisma.matchPlayer.deleteMany({ where: { id: { in: idsToDelete } } });
    }

    res.json({
      message:           'Match players populated successfully',
      count:             created.length,
      duplicatesRemoved: idsToDelete.length,
    });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * Removes duplicate match_player entries by name.
 * Keeps the oldest entry (lowest id) for each unique (matchId, team, name) tuple.
 */
const dedupeMatchPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id as string;
    const matchPlayers = await prisma.matchPlayer.findMany({
      where: { matchId },
      include: { player: { select: { name: true } } },
      orderBy: { id: 'asc' },
    });

    const seen = new Map<string, string>(); // key: "team|name" → id of kept row
    const idsToDelete: string[] = [];

    for (const mp of matchPlayers) {
      const name = mp.player?.name?.toLowerCase().trim() ?? '';
      const key = `${mp.team ?? 0}|${name}`;
      if (seen.has(key)) {
        idsToDelete.push(mp.id);
      } else {
        seen.set(key, mp.id);
      }
    }

    if (idsToDelete.length > 0) {
      await prisma.matchPlayer.deleteMany({
        where: { id: { in: idsToDelete } },
      });
    }

    res.json({
      message: 'Duplicates removed',
      removed: idsToDelete.length,
      remaining: matchPlayers.length - idsToDelete.length,
    });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

/**
 * PUT /matches/:id/players/:playerId/toggle-playing
 * Toggle whether an approved player is in the playing XI for the match
 */
const togglePlaying = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const matchId = req.params.id as string;
    const playerId = req.params.playerId as string;
    const { is_playing } = req.body;

    if (typeof is_playing !== 'boolean') {
      res.status(400).json({ error: 'is_playing must be a boolean' });
      return;
    }

    // Find the match player
    const matchPlayer = await prisma.matchPlayer.findUnique({
      where: { matchId_playerId: { matchId, playerId } },
    });

    if (!matchPlayer) {
      res.status(404).json({ error: 'Player not found in this match' });
      return;
    }

    if (matchPlayer.status !== 'approved') {
      res.status(400).json({ error: 'Only approved players can be added to playing XI' });
      return;
    }

    // Update the playing status
    const updated = await prisma.matchPlayer.update({
      where: { matchId_playerId: { matchId, playerId } },
      data: { isPlaying: is_playing },
    });

    res.json(toSnake(updated));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default {
  joinMatch,
  getMatchPlayers,
  approveMatchPlayer,
  getApprovedPlayers,
  populateMatchPlayers,
  dedupeMatchPlayers,
  togglePlaying,
};
