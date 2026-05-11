import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import supabaseStorage from '../config/supabase';
import toSnake from '../utils/toSnake';
import { AuthRequest } from '../middleware/auth';

const getRegisteredPlayers = async (req: AuthRequest, res: Response): Promise<void> => {
  const { search } = req.query as { search?: string };
  try {
    const players = await prisma.registeredPlayer.findMany({
      where: search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { playerIdCode: { contains: search, mode: 'insensitive' } },
          { schoolName: { contains: search, mode: 'insensitive' } },
          { clubName: { contains: search, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    res.json(toSnake(players));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const createRegisteredPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    name, date_of_birth, email, phone, emergency_contact, emergency_contact_name,
    address, city, state, country, postal_code,
    height, weight, blood_group,
    school_name, club_name, batting_style, bowling_style, playing_role, jersey_number,
    father_name, mother_name, guardian_name, nationality,
  } = req.body;
  try {
    const count = await prisma.registeredPlayer.count();
    const playerIdCode = `GUCT-${String(count + 1).padStart(4, '0')}`;

    const player = await prisma.registeredPlayer.create({
      data: {
        name,
        playerIdCode,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        email: email || null,
        phone: phone || null,
        emergencyContact: emergency_contact || null,
        emergencyContactName: emergency_contact_name || null,
        address: address || null,
        city: city || null,
        state: state || null,
        country: country || null,
        postalCode: postal_code || null,
        height: height ? parseFloat(height) : null,
        weight: weight ? parseFloat(weight) : null,
        bloodGroup: blood_group || null,
        schoolName: school_name || null,
        clubName: club_name || null,
        battingStyle: batting_style || null,
        bowlingStyle: bowling_style || null,
        playingRole: playing_role || null,
        jerseyNumber: jersey_number ? parseInt(jersey_number) : null,
        fatherName: father_name || null,
        motherName: mother_name || null,
        guardianName: guardian_name || null,
        nationality: nationality || null,
        createdBy: req.user.id,
      },
    });

    // If email provided, auto-create a User account so the player can log in
    if (email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (!existing) {
        const hashedPassword = await bcrypt.hash('player123', 10);
        await prisma.user.create({
          data: {
            name,
            email,
            password: hashedPassword,
            role: 'player',
            phone: phone || null,
            battingStyle: batting_style || null,
            bowlingStyle: bowling_style || null,
            approved: true,
          },
        });
      }
    }

    res.status(201).json(toSnake(player));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const uploadPlayerPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const currentPlayer = await prisma.registeredPlayer.findUnique({
      where: { id: req.params.id as string },
      select: { photoUrl: true },
    });

    if (!currentPlayer) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const oldPhotoUrl = currentPlayer.photoUrl;
    if (oldPhotoUrl && oldPhotoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try {
        await supabaseStorage.deleteFile(oldPhotoUrl);
      } catch (err: unknown) {
        console.warn('Failed to delete old photo:', (err as Error).message);
      }
    }

    const photoUrl = await supabaseStorage.uploadFile(
      req.file,
      `player_${req.params.id}_${Date.now()}`,
    );

    const player = await prisma.registeredPlayer.update({
      where: { id: req.params.id as string },
      data: { photoUrl },
    });

    res.json(toSnake(player));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updateRegisteredPlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  const {
    name, date_of_birth, email, phone, emergency_contact, emergency_contact_name,
    address, city, state, country, postal_code,
    height, weight, blood_group,
    school_name, club_name, batting_style, bowling_style, playing_role, jersey_number,
    father_name, mother_name, guardian_name, nationality,
  } = req.body;
  try {
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (date_of_birth) data.dateOfBirth = new Date(date_of_birth);
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (emergency_contact !== undefined) data.emergencyContact = emergency_contact;
    if (emergency_contact_name !== undefined) data.emergencyContactName = emergency_contact_name;
    if (address !== undefined) data.address = address;
    if (city !== undefined) data.city = city;
    if (state !== undefined) data.state = state;
    if (country !== undefined) data.country = country;
    if (postal_code !== undefined) data.postalCode = postal_code;
    if (height !== undefined) data.height = height ? parseFloat(height) : null;
    if (weight !== undefined) data.weight = weight ? parseFloat(weight) : null;
    if (blood_group !== undefined) data.bloodGroup = blood_group;
    if (school_name !== undefined) data.schoolName = school_name;
    if (club_name !== undefined) data.clubName = club_name;
    if (batting_style !== undefined) data.battingStyle = batting_style;
    if (bowling_style !== undefined) data.bowlingStyle = bowling_style;
    if (playing_role !== undefined) data.playingRole = playing_role;
    if (jersey_number !== undefined) data.jerseyNumber = jersey_number ? parseInt(jersey_number) : null;
    if (father_name !== undefined) data.fatherName = father_name;
    if (mother_name !== undefined) data.motherName = mother_name;
    if (guardian_name !== undefined) data.guardianName = guardian_name;
    if (nationality !== undefined) data.nationality = nationality;

    const player = await prisma.registeredPlayer.update({
      where: { id: req.params.id as string },
      data,
    });
    res.json(toSnake(player));
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const deletePlayerPhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.params.id as string;
    const player = await prisma.registeredPlayer.findUnique({
      where: { id: playerId },
      select: { photoUrl: true },
    });

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    if (player.photoUrl && player.photoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try {
        await supabaseStorage.deleteFile(player.photoUrl);
      } catch (err: unknown) {
        console.warn('Failed to delete photo from storage:', (err as Error).message);
      }
    }

    const updatedPlayer = await prisma.registeredPlayer.update({
      where: { id: playerId },
      data: { photoUrl: null },
    });

    res.json(toSnake(updatedPlayer));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const deletePlayer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playerId = req.params.id as string;
    const player = await prisma.registeredPlayer.findUnique({
      where: { id: playerId },
      select: { photoUrl: true },
    });

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    if (player.photoUrl && player.photoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try {
        await supabaseStorage.deleteFile(player.photoUrl);
      } catch (err: unknown) {
        console.warn('Failed to delete photo from storage:', (err as Error).message);
      }
    }

    await prisma.registeredPlayer.delete({
      where: { id: playerId },
    });

    res.json({ message: 'Player deleted successfully' });
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    if (err.code === 'P2025') {
      res.status(404).json({ error: 'Player not found' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const backfillPlayerAccounts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const playersWithEmail = await prisma.registeredPlayer.findMany({
      where: { email: { not: null } },
      select: { email: true, name: true, phone: true, battingStyle: true, bowlingStyle: true },
    });

    let created = 0;
    let skipped = 0;

    for (const p of playersWithEmail) {
      if (!p.email) continue;
      const existing = await prisma.user.findUnique({ where: { email: p.email } });
      if (existing) { skipped++; continue; }
      const hashedPassword = await bcrypt.hash('player123', 10);
      await prisma.user.create({
        data: {
          name: p.name,
          email: p.email,
          password: hashedPassword,
          role: 'player',
          phone: p.phone || null,
          battingStyle: p.battingStyle || null,
          bowlingStyle: p.bowlingStyle || null,
          approved: true,
        },
      });
      created++;
    }

    res.json({ message: `Done. Created ${created} accounts, skipped ${skipped} (already existed).` });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

export default {
  getRegisteredPlayers,
  createRegisteredPlayer,
  uploadPlayerPhoto,
  updateRegisteredPlayer,
  deletePlayerPhoto,
  deletePlayer,
  backfillPlayerAccounts,
};
