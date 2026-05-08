import { Response } from 'express';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import supabaseStorage from '../services/supabaseStorage';
import { AuthRequest } from '../middleware/auth';

const getTeams = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teams = await prisma.team.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(toSnake(teams));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const getTeamById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id as string },
    });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const players = await prisma.teamPlayer.findMany({
      where: { teamId: req.params.id as string },
      include: {
        player: {
          select: {
            id: true,
            name: true,
            dateOfBirth: true,
            photoUrl: true,
            playerIdCode: true,
          },
        },
      },
      orderBy: { player: { name: 'asc' } },
    });

    res.json(toSnake({
      ...team,
      players: players.map((tp) => ({
        id: tp.id,
        team_id: tp.teamId,
        player_id: tp.playerId,
        player_name: tp.player.name,
        date_of_birth: tp.player.dateOfBirth,
        photo_url: tp.player.photoUrl,
        player_id_code: tp.player.playerIdCode,
        is_captain: tp.isCaptain,
        is_wicket_keeper: tp.isWicketKeeper,
      })),
    }));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json(toSnake({ error: err.message }));
  }
};

const createTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  const { team_name, team_type, school_name, club_name } = req.body;
  try {
    const team = await prisma.team.create({
      data: {
        teamName: team_name,
        teamType: team_type,
        schoolName: school_name || null,
        clubName: club_name || null,
        createdBy: req.user.id,
      },
    });
    res.status(201).json(toSnake(team));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const addPlayerToTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  const { player_id } = req.body;
  try {
    await prisma.teamPlayer.create({
      data: {
        teamId: req.params.id as string,
        playerId: player_id,
      },
    });
    res.status(201).json({ message: 'Player added to team' });
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Player already in team' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const removePlayerFromTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await prisma.teamPlayer.deleteMany({
      where: {
        teamId: req.params.teamId as string,
        playerId: req.params.playerId as string,
      },
    });
    res.json({ message: 'Player removed from team' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updateTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  const { team_name, team_type, school_name, club_name } = req.body;
  try {
    const data: Record<string, unknown> = {};
    if (team_name) data.teamName = team_name;
    if (team_type) data.teamType = team_type;
    if (school_name !== undefined) data.schoolName = school_name || null;
    if (club_name !== undefined) data.clubName = club_name || null;

    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    const team = await prisma.team.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(toSnake(team));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updatePlayerRole = async (req: AuthRequest, res: Response): Promise<void> => {
  const { is_captain, is_wicket_keeper } = req.body;
  try {
    const teamId = req.params.teamId as string;
    const playerId = req.params.playerId as string;

    if (is_captain === true) {
      await prisma.teamPlayer.updateMany({
        where: { teamId, isCaptain: true },
        data: { isCaptain: false },
      });
    }

    if (is_wicket_keeper === true) {
      await prisma.teamPlayer.updateMany({
        where: { teamId, isWicketKeeper: true },
        data: { isWicketKeeper: false },
      });
    }

    const data: Record<string, unknown> = {};
    if (is_captain !== undefined) data.isCaptain = is_captain;
    if (is_wicket_keeper !== undefined) data.isWicketKeeper = is_wicket_keeper;

    await prisma.teamPlayer.updateMany({
      where: { teamId, playerId },
      data,
    });

    res.json({ message: 'Player role updated successfully' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const uploadTeamLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const teamId = req.params.id as string;
    const team = await prisma.team.findUnique({ where: { id: teamId } });
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (team.logoUrl) {
      await supabaseStorage.deleteFile(team.logoUrl);
    }

    const fileName = `team_${teamId}_${Date.now()}`;
    const logoUrl = await supabaseStorage.uploadFile(req.file, fileName);

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl },
    });

    res.json(toSnake(updatedTeam));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const deleteTeamLogo = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const teamId = req.params.id as string;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { logoUrl: true },
    });

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    if (team.logoUrl && team.logoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try {
        await supabaseStorage.deleteFile(team.logoUrl);
      } catch (err: unknown) {
        console.warn('Failed to delete logo from storage:', (err as Error).message);
      }
    }

    const updatedTeam = await prisma.team.update({
      where: { id: teamId },
      data: { logoUrl: null },
    });

    res.json(toSnake(updatedTeam));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default {
  getTeams,
  getTeamById,
  createTeam,
  addPlayerToTeam,
  removePlayerFromTeam,
  updateTeam,
  updatePlayerRole,
  uploadTeamLogo,
  deleteTeamLogo,
};
