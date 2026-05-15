/**
 * @fileoverview Roles & Permissions controller — admins manage RoleConfig
 * entries (which mirror the role strings used across the app) and the
 * Permission rows they grant.
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import toSnake from '../utils/toSnake';

const ok = (res: Response, data: unknown, meta?: Record<string, unknown>) =>
  res.json({ success: true, data: toSnake(data), ...(meta ? { meta } : {}) });
const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, error: { code: `E${status}`, message } });

const listRoles = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const roles = await (prisma as any).roleConfig.findMany({
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: 'asc' },
    });
    const flattened = roles.map((r: any) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      max_users: r.maxUsers,
      is_system: r.isSystem,
      created_at: r.createdAt,
      permissions: r.permissions.map((rp: any) => ({
        id: rp.permission.id,
        name: rp.permission.name,
        resource: rp.permission.resource,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      user_count: 0, // filled below
    }));
    // Add user counts
    const counts = await prisma.user.groupBy({ by: ['role'], _count: { _all: true } });
    const countMap = new Map(counts.map((c) => [c.role, c._count._all]));
    flattened.forEach((r: any) => { r.user_count = countMap.get(r.name) ?? 0; });
    ok(res, flattened);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list roles');
  }
};

const getRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const role = await (prisma as any).roleConfig.findUnique({
      where: { id: req.params.id as string },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role) return fail(res, 404, 'Role not found') as any;
    const users = await prisma.user.findMany({
      where: { role: role.name },
      select: { id: true, name: true, email: true, role: true, approved: true },
      take: 200,
    });
    ok(res, {
      id: role.id,
      name: role.name,
      description: role.description,
      max_users: role.maxUsers,
      is_system: role.isSystem,
      created_at: role.createdAt,
      permissions: role.permissions.map((rp: any) => rp.permission),
      users,
    });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch role');
  }
};

const createRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, description, maxUsers, permissions } = req.body as { name: string; description?: string; maxUsers?: number; permissions?: string[] };
    if (!name) return fail(res, 400, 'name is required') as any;
    const role = await (prisma as any).roleConfig.create({
      data: { name, description: description || null, maxUsers: maxUsers ?? null },
    });
    if (permissions && permissions.length > 0) {
      const perms = await prisma.permission.findMany({ where: { OR: [{ id: { in: permissions } }, { name: { in: permissions } }] } });
      await (prisma as any).rolePermission.createMany({
        data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
        skipDuplicates: true,
      });
    }
    ok(res, role);
  } catch (e: any) {
    if (e?.code === 'P2002') return fail(res, 409, 'Role already exists') as any;
    fail(res, 500, e.message ?? 'Failed to create role');
  }
};

const updateRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { description, maxUsers, permissions } = req.body as { description?: string; maxUsers?: number | null; permissions?: string[] };
    const updated = await (prisma as any).roleConfig.update({
      where: { id },
      data: {
        ...(description !== undefined ? { description } : {}),
        ...(maxUsers !== undefined ? { maxUsers } : {}),
      },
    });
    if (permissions) {
      await (prisma as any).rolePermission.deleteMany({ where: { roleId: id } });
      const perms = await prisma.permission.findMany({ where: { OR: [{ id: { in: permissions } }, { name: { in: permissions } }] } });
      if (perms.length > 0) {
        await (prisma as any).rolePermission.createMany({
          data: perms.map((p) => ({ roleId: id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }
    }
    ok(res, updated);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to update role');
  }
};

const deleteRole = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const role = await (prisma as any).roleConfig.findUnique({ where: { id } });
    if (!role) return fail(res, 404, 'Role not found') as any;
    if (role.isSystem) return fail(res, 400, 'Cannot delete a system role') as any;
    await (prisma as any).roleConfig.delete({ where: { id } });
    ok(res, { id, deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete role');
  }
};

const listPermissions = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const perms = await prisma.permission.findMany({ orderBy: [{ resource: 'asc' }, { action: 'asc' }] });
    ok(res, perms);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list permissions');
  }
};

const createPermission = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, resource, action, description } = req.body;
    if (!name || !resource || !action) return fail(res, 400, 'name, resource, action required') as any;
    const perm = await prisma.permission.create({ data: { name, resource, action, description: description || null } });
    ok(res, perm);
  } catch (e: any) {
    if (e?.code === 'P2002') return fail(res, 409, 'Permission already exists') as any;
    fail(res, 500, e.message ?? 'Failed to create permission');
  }
};

export default {
  listRoles, getRole, createRole, updateRole, deleteRole,
  listPermissions, createPermission,
};
