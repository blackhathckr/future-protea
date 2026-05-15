/**
 * @fileoverview Seed default permissions + role configs so the admin panel has
 * meaningful data the first time it loads. Safe to run repeatedly.
 *
 * Invoke from app.ts on boot, or as a one-off via `pnpm exec ts-node …`.
 */

import prisma from '../config/database';
import logger from './logger';

const PERMISSIONS = [
  { name: 'matches.view',         resource: 'matches',       action: 'view' },
  { name: 'matches.create',       resource: 'matches',       action: 'create' },
  { name: 'matches.score',        resource: 'matches',       action: 'score' },
  { name: 'matches.delete',       resource: 'matches',       action: 'delete' },
  { name: 'tournaments.view',     resource: 'tournaments',   action: 'view' },
  { name: 'tournaments.manage',   resource: 'tournaments',   action: 'manage' },
  { name: 'teams.view',           resource: 'teams',         action: 'view' },
  { name: 'teams.manage',         resource: 'teams',         action: 'manage' },
  { name: 'players.view',         resource: 'players',       action: 'view' },
  { name: 'players.approve',      resource: 'players',       action: 'approve' },
  { name: 'users.manage',         resource: 'users',         action: 'manage' },
  { name: 'roles.manage',         resource: 'roles',         action: 'manage' },
  { name: 'announcements.manage', resource: 'announcements', action: 'manage' },
  { name: 'support.handle',       resource: 'support',       action: 'handle' },
  { name: 'analytics.view',       resource: 'analytics',     action: 'view' },
  { name: 'settings.manage',      resource: 'settings',      action: 'manage' },
];

const ROLES: Array<{ name: string; description: string; isSystem: boolean; permissions: string[] }> = [
  {
    name: 'admin',
    description: 'Super-user with full access to every module.',
    isSystem: true,
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'tournament_organiser',
    description: 'Creates and manages tournaments, fixtures, and team assignments.',
    isSystem: true,
    permissions: ['matches.view', 'tournaments.view', 'tournaments.manage', 'teams.view', 'players.view', 'announcements.manage'],
  },
  {
    name: 'scorer',
    description: 'Records ball-by-ball scoring during live matches.',
    isSystem: true,
    permissions: ['matches.view', 'matches.score', 'players.view', 'teams.view'],
  },
  {
    name: 'feeder',
    description: 'Legacy scorer alias.',
    isSystem: true,
    permissions: ['matches.view', 'matches.score', 'players.view', 'teams.view'],
  },
  {
    name: 'coach',
    description: 'Read-only access to analytics, teams, and player profiles.',
    isSystem: true,
    permissions: ['matches.view', 'teams.view', 'players.view', 'analytics.view'],
  },
  {
    name: 'umpire',
    description: 'Field official; can view matches.',
    isSystem: true,
    permissions: ['matches.view', 'teams.view', 'players.view'],
  },
  {
    name: 'player',
    description: 'Registered player viewing their own matches and stats.',
    isSystem: true,
    permissions: ['matches.view', 'teams.view'],
  },
  {
    name: 'spectator',
    description: 'Read-only public viewer.',
    isSystem: true,
    permissions: ['matches.view'],
  },
];

export async function seedAdminDefaults(): Promise<void> {
  try {
    // Permissions
    for (const p of PERMISSIONS) {
      await prisma.permission.upsert({
        where: { name: p.name },
        update: {},
        create: p,
      });
    }
    // Role configs + role/permission junctions
    for (const r of ROLES) {
      const role = await (prisma as any).roleConfig.upsert({
        where: { name: r.name },
        update: { description: r.description, isSystem: r.isSystem },
        create: { name: r.name, description: r.description, isSystem: r.isSystem },
      });
      const perms = await prisma.permission.findMany({ where: { name: { in: r.permissions } } });
      if (perms.length > 0) {
        await (prisma as any).rolePermission.createMany({
          data: perms.map((p) => ({ roleId: role.id, permissionId: p.id })),
          skipDuplicates: true,
        });
      }
    }
    logger.info(`[seed] Admin defaults ready (${PERMISSIONS.length} permissions, ${ROLES.length} roles).`);
  } catch (e) {
    logger.error('[seed] Failed to seed admin defaults', e);
  }
}
