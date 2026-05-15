/**
 * @fileoverview Announcement controller — CRUD + publish/unpublish.
 * Publishing an announcement also fans a Notification out to every user with
 * a matching target role so the inbox UI lights up immediately.
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import toSnake from '../utils/toSnake';

const ok = (res: Response, data: unknown, meta?: Record<string, unknown>) =>
  res.json({ success: true, data: toSnake(data), ...(meta ? { meta } : {}) });
const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, error: { code: `E${status}`, message } });

const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, active } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (active === 'true') where.isActive = true;
    if (active === 'false') where.isActive = false;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const [total, items] = await Promise.all([
      (prisma as any).announcement.count({ where }),
      (prisma as any).announcement.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, items, { page: pageN, limit: limitN, total });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list announcements');
  }
};

const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const a = await (prisma as any).announcement.findUnique({ where: { id: req.params.id as string } });
    if (!a) return fail(res, 404, 'Announcement not found') as any;
    ok(res, a);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch announcement');
  }
};

const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, content, targetRoles = [], expiresAt } = req.body;
    if (!title || !content) return fail(res, 400, 'title and content required') as any;
    const a = await (prisma as any).announcement.create({
      data: {
        title,
        content,
        targetRoles,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdById: req.user?.id ?? null,
      },
    });
    ok(res, a);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to create announcement');
  }
};

const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, content, targetRoles, expiresAt } = req.body;
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (content !== undefined) data.content = content;
    if (targetRoles !== undefined) data.targetRoles = targetRoles;
    if (expiresAt !== undefined) data.expiresAt = expiresAt ? new Date(expiresAt) : null;
    const a = await (prisma as any).announcement.update({ where: { id }, data });
    ok(res, a);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to update announcement');
  }
};

const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await (prisma as any).announcement.delete({ where: { id: req.params.id as string } });
    ok(res, { id: req.params.id, deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete announcement');
  }
};

/** Publish: mark active + fan out a Notification to every targeted user. */
const publish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const a = await (prisma as any).announcement.update({
      where: { id },
      data: { isActive: true, publishedAt: new Date() },
    });

    // Fan-out notifications
    const where: Record<string, unknown> = {};
    if (Array.isArray(a.targetRoles) && a.targetRoles.length > 0) {
      where.OR = [
        { role: { in: a.targetRoles } },
        { userRoles: { some: { role: { in: a.targetRoles } } } },
      ];
    }
    const users = await prisma.user.findMany({ where, select: { id: true } });
    if (users.length > 0) {
      await (prisma as any).notification.createMany({
        data: users.map((u) => ({
          userId: u.id,
          title: a.title,
          message: a.content,
          type: 'info',
          category: 'announcement',
          link: `/announcements/${a.id}`,
          metadata: { announcement_id: a.id },
        })),
      });
    }

    ok(res, { ...a, recipients_notified: users.length });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to publish announcement');
  }
};

const unpublish = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const a = await (prisma as any).announcement.update({
      where: { id: req.params.id as string },
      data: { isActive: false },
    });
    ok(res, a);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to unpublish announcement');
  }
};

/**
 * GET /announcements/active — public-ish endpoint a Flutter / web app calls to
 * fetch every announcement that's currently visible to the authenticated user.
 */
const listActiveForUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userRoles = req.user.roles?.length ? req.user.roles : [req.user.role];
    const now = new Date();
    const items = await (prisma as any).announcement.findMany({
      where: {
        isActive: true,
        publishedAt: { lte: now, not: null },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      orderBy: { publishedAt: 'desc' },
    });
    const visible = items.filter((a: any) =>
      !a.targetRoles || a.targetRoles.length === 0 || a.targetRoles.some((r: string) => userRoles.includes(r)),
    );
    ok(res, visible);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch active announcements');
  }
};

export default { list, getOne, create, update, remove, publish, unpublish, listActiveForUser };
