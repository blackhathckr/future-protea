import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';
import toSnake from '../utils/toSnake';
import supabaseStorage from '../services/supabaseStorage';
import { AuthRequest } from '../middleware/auth';
import { AUTO_APPROVED_ROLES, isValidRole, VALID_ROLES, type Role } from '../utils/roles';

const USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  phone: true,
  photoUrl: true,
  dateOfBirth: true,
  battingStyle: true,
  bowlingStyle: true,
  approved: true,
  createdAt: true,
  lastLogin: true,
} as const;

const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, email, password, role, phone, date_of_birth, batting_style, bowling_style, playing_role } = req.body;
  try {
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }

    // Validate role against the BRD-aligned whitelist. An unspecified role
    // defaults to 'player'; an invalid role is rejected with 400.
    let resolvedRole: Role;
    if (role == null || role === '') {
      resolvedRole = 'player';
    } else if (isValidRole(role)) {
      resolvedRole = role;
    } else {
      res.status(400).json({
        error: `Invalid role "${role}". Valid roles: ${VALID_ROLES.join(', ')}`,
      });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: resolvedRole,
        phone: phone || null,
        dateOfBirth: date_of_birth ? new Date(date_of_birth) : null,
        battingStyle: batting_style || null,
        bowlingStyle: bowling_style || null,
        approved: AUTO_APPROVED_ROLES.has(resolvedRole),
        userRoles: {
          create: [{ role: resolvedRole }],
        },
      },
      select: USER_SELECT,
    });
    const token = jwt.sign(
      { id: user.id, role: user.role, roles: [user.role], name: user.name },
      process.env.JWT_SECRET as string,
    );
    res.status(201).json({ token, user: toSnake(user) });
  } catch (error: unknown) {
    const err = error as { code?: string; message: string };
    console.error('Register error:', err.message);
    if (err.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    res.status(500).json({ error: err.message });
  }
};

const login = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, password } = req.body;
  try {
    if (!prisma) {
      res.status(500).json({ error: 'Database connection failed' });
      return;
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Invalid password' });
      return;
    }

    user = await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    let roles = [user.role];
    try {
      const userRoleRows = await prisma.userRole.findMany({
        where: { userId: user.id },
        select: { role: true },
      });
      if (userRoleRows && userRoleRows.length > 0) {
        roles = userRoleRows.map((r) => r.role);
      }
    } catch (roleError: unknown) {
      console.warn('Failed to fetch user roles:', (roleError as Error).message);
      // Continue with default role if userRole fetch fails
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, roles, name: user.name },
      process.env.JWT_SECRET as string,
    );
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        photo_url: user.photoUrl,
        date_of_birth: user.dateOfBirth,
        batting_style: user.battingStyle,
        bowling_style: user.bowlingStyle,
        approved: user.approved,
        created_at: user.createdAt,
        last_login: user.lastLogin,
      },
    });
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error('Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: USER_SELECT,
    });
    res.json(toSnake(user));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  const { name, phone, date_of_birth, batting_style, bowling_style } = req.body;
  try {
    const data: Record<string, unknown> = {};
    if (name) data.name = name;
    if (phone !== undefined) data.phone = phone || null;
    if (date_of_birth !== undefined) data.dateOfBirth = date_of_birth ? new Date(date_of_birth) : null;
    if (batting_style !== undefined) data.battingStyle = batting_style || null;
    if (bowling_style !== undefined) data.bowlingStyle = bowling_style || null;

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: USER_SELECT,
    });
    res.json(toSnake(user));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const uploadProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const fileName = `user_${req.user.id}_${Date.now()}`;
    const photoUrl = await supabaseStorage.uploadFile(req.file, fileName);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { photoUrl },
      select: USER_SELECT,
    });
    res.json(toSnake(user));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const deleteProfilePhoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { photoUrl: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.photoUrl && user.photoUrl.includes('supabase') && supabaseStorage.isConfigured()) {
      try {
        await supabaseStorage.deleteFile(user.photoUrl);
      } catch (err: unknown) {
        console.warn('Failed to delete photo from storage:', (err as Error).message);
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: { photoUrl: null },
      select: USER_SELECT,
    });

    res.json(toSnake(updatedUser));
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { current_password, new_password } = req.body;
  try {
    if (!current_password || !new_password) {
      res.status(400).json({ error: 'Current password and new password are required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const validPassword = await bcrypt.compare(current_password, user.password);
    if (!validPassword) {
      res.status(400).json({ error: 'Current password is incorrect' });
      return;
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });
    res.json({ message: 'Password changed successfully' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const forgotPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email } = req.body;
  try {
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success even if user not found (security: don't reveal if email exists)
      res.json({ message: 'If this email is registered, an OTP has been sent' });
      return;
    }

    // TODO: In production, send real OTP via email service
    // For now, OTP is hardcoded as 123456
    res.json({ message: 'If this email is registered, an OTP has been sent' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const resetPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { email, otp, new_password } = req.body;
  try {
    if (!email || !otp || !new_password) {
      res.status(400).json({ error: 'Email, OTP, and new password are required' });
      return;
    }

    if (new_password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters' });
      return;
    }

    // TODO: In production, validate OTP from cache/DB
    // For now, accept hardcoded OTP 123456
    if (otp !== '123456') {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ error: 'User not found' });
      return;
    }

    const hashedPassword = await bcrypt.hash(new_password, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error: unknown) {
    const err = error as { message: string };
    res.status(500).json({ error: err.message });
  }
};

const refreshToken = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      res.status(401).json({ error: 'No refresh token provided' });
      return;
    }

    // Verify refresh token
    jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string, async (err: any, decoded: any) => {
      if (err) {
        res.status(401).json({ error: 'Invalid refresh token' });
        return;
      }

      const userId = decoded.id;
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        res.status(401).json({ error: 'User not found' });
        return;
      }

      // Generate new access token
      let roles = [user.role];
      try {
        const userRoleRows = await prisma.userRole.findMany({
          where: { userId: user.id },
          select: { role: true },
        });
        if (userRoleRows && userRoleRows.length > 0) {
          roles = userRoleRows.map((r) => r.role);
        }
      } catch (roleError: unknown) {
        console.warn('Failed to fetch user roles:', (roleError as Error).message);
      }

      const newAccessToken = jwt.sign(
        { id: user.id, role: user.role, roles, name: user.name },
        process.env.JWT_SECRET as string,
        { expiresIn: '15m' }
      );

      res.json({ accessToken: newAccessToken });
    });
  } catch (error: unknown) {
    const err = error as { message: string };
    console.error('Refresh token error:', err.message);
    res.status(500).json({ error: err.message });
  }
};

export default { register, login, getMe, updateProfile, uploadProfilePhoto, deleteProfilePhoto, changePassword, forgotPassword, resetPassword, refreshToken };
