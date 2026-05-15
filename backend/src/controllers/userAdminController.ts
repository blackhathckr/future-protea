/**
 * @fileoverview Admin user-management controller.
 * Provides CRUD over the User table for admins, plus bulk operations.
 * Mounted at /api/users/*.
 */

import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import toSnake from '../utils/toSnake';
import logger from '../utils/logger';

const ok = (res: Response, data: unknown, meta?: Record<string, unknown>) =>
  res.json({ success: true, data: toSnake(data), ...(meta ? { meta } : {}) });

const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, error: { code: `E${status}`, message } });

const writeAudit = async (actorUserId: string | null, action: string, entityType: string, entityId: string, before: unknown, after: unknown, ipAddress?: string) => {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        before: before == null ? undefined : (before as any),
        after: after == null ? undefined : (after as any),
        ipAddress: ipAddress || null,
      },
    });
  } catch (e) {
    logger.error('audit log write failed', e);
  }
};

const listUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { role, status, search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (status === 'approved') where.approved = true;
    if (status === 'pending') where.approved = false;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true, name: true, email: true, role: true, phone: true,
          photoUrl: true, approved: true, createdAt: true, lastLogin: true,
          userRoles: { select: { role: true, grantedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, users, { page: pageN, limit: limitN, total, total_pages: Math.ceil(total / limitN) });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list users');
  }
};

const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id as string },
      select: {
        id: true, name: true, email: true, role: true, phone: true,
        photoUrl: true, approved: true, createdAt: true, lastLogin: true,
        userRoles: { select: { role: true, grantedAt: true, grantedBy: true } },
      },
    });
    if (!user) return fail(res, 404, 'User not found') as any;
    ok(res, user);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch user');
  }
};

const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, role = 'player', phone, approved = true } = req.body;
    if (!name || !email || !password) return fail(res, 400, 'name, email and password are required') as any;
    const hash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { name, email, password: hash, role, phone: phone || null, approved },
      select: { id: true, name: true, email: true, role: true, phone: true, approved: true, createdAt: true },
    });
    // Also create UserRole entry for multi-role consistency
    await prisma.userRole.create({
      data: { userId: created.id, role, grantedBy: req.user?.id ?? null },
    }).catch(() => {/* unique violation */});
    await writeAudit(req.user?.id ?? null, 'user.create', 'user', created.id, null, created, req.ip);
    ok(res, created);
  } catch (e: any) {
    if (e?.code === 'P2002') return fail(res, 409, 'Email already exists') as any;
    fail(res, 500, e.message ?? 'Failed to create user');
  }
};

const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return fail(res, 404, 'User not found') as any;

    const { name, phone, role, approved, password, photoUrl, roleId } = req.body;
    const data: Record<string, unknown> = {};
    if (name != null) data.name = name;
    if (phone != null) data.phone = phone;
    if (role != null) data.role = role;
    if (approved != null) data.approved = approved;
    if (photoUrl != null) data.photoUrl = photoUrl;
    if (password) data.password = await bcrypt.hash(password, 10);

    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, phone: true, approved: true, createdAt: true, lastLogin: true },
    });

    // If a roleId (RoleConfig.id) was passed, sync UserRole entries to that role name.
    if (roleId) {
      try {
        const roleConfig = await (prisma as any).roleConfig.findUnique({ where: { id: roleId } });
        if (roleConfig) {
          await prisma.userRole.deleteMany({ where: { userId: id } });
          await prisma.userRole.create({
            data: { userId: id, role: roleConfig.name, grantedBy: req.user?.id ?? null },
          });
          await prisma.user.update({ where: { id }, data: { role: roleConfig.name } });
          updated.role = roleConfig.name;
        }
      } catch (e) {
        logger.error('role assignment failed', e);
      }
    }

    await writeAudit(req.user?.id ?? null, 'user.update', 'user', id, before, updated, req.ip);
    ok(res, updated);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to update user');
  }
};

const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const before = await prisma.user.findUnique({ where: { id } });
    if (!before) return fail(res, 404, 'User not found') as any;
    await prisma.user.delete({ where: { id } });
    await writeAudit(req.user?.id ?? null, 'user.delete', 'user', id, before, null, req.ip);
    ok(res, { id, deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete user');
  }
};

const bulkUploadUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { users } = req.body as { users: Array<{ name: string; email: string; password: string; role?: string; phone?: string }> };
    if (!Array.isArray(users) || users.length === 0) return fail(res, 400, 'users array is required') as any;
    let created = 0; let skipped = 0; const errors: Array<{ email: string; reason: string }> = [];
    for (const u of users) {
      try {
        if (!u.email || !u.name || !u.password) { skipped++; errors.push({ email: u.email, reason: 'Missing required fields' }); continue; }
        const exists = await prisma.user.findUnique({ where: { email: u.email } });
        if (exists) { skipped++; errors.push({ email: u.email, reason: 'Email exists' }); continue; }
        const hash = await bcrypt.hash(u.password, 10);
        const newUser = await prisma.user.create({
          data: { name: u.name, email: u.email, password: hash, role: u.role || 'player', phone: u.phone || null, approved: true },
        });
        await prisma.userRole.create({ data: { userId: newUser.id, role: u.role || 'player', grantedBy: req.user?.id ?? null } }).catch(() => {});
        created++;
      } catch (e: any) {
        errors.push({ email: u.email, reason: e.message ?? 'unknown' });
      }
    }
    ok(res, { created, skipped, total: users.length, errors });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Bulk upload failed');
  }
};

const bulkDeleteUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { identifiers, reason, dryRun } = req.body as { identifiers: string[]; reason: string; dryRun?: boolean };
    if (!Array.isArray(identifiers) || identifiers.length === 0) return fail(res, 400, 'identifiers required') as any;
    const matches = await prisma.user.findMany({
      where: { OR: [{ id: { in: identifiers } }, { email: { in: identifiers } }] },
      select: { id: true, name: true, email: true, role: true },
    });
    if (dryRun) return ok(res, { matched: matches.length, users: matches, deleted: 0, dry_run: true }) as any;
    const ids = matches.map((m) => m.id);
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await writeAudit(req.user?.id ?? null, 'user.bulk_delete', 'user', 'bulk', { identifiers, reason }, { deleted: ids }, req.ip);
    ok(res, { deleted: ids.length, users: matches });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Bulk delete failed');
  }
};

const getAuditLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { action, search, userId, module, page = '1', limit = '50' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (userId) where.actorUserId = userId;
    if (module) where.entityType = module;
    if (search) {
      where.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { entityType: { contains: search, mode: 'insensitive' } },
      ];
    }
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, email: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, logs, { page: pageN, limit: limitN, total, total_pages: Math.ceil(total / limitN) });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch audit logs');
  }
};

const getAuditModules = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const modules = await prisma.auditLog.findMany({ distinct: ['entityType'], select: { entityType: true } });
    ok(res, modules.map((m) => m.entityType));
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch modules');
  }
};

export default {
  listUsers, getUser, createUser, updateUser, deleteUser,
  bulkUploadUsers, bulkDeleteUsers, getAuditLogs, getAuditModules,
};
