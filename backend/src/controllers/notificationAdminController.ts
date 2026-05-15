/**
 * @fileoverview Notification controller — user-facing inbox endpoints plus an
 * admin broadcast that fans a single message out to every user with one of
 * the target roles.
 */

import { Response } from 'express';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import toSnake from '../utils/toSnake';

const ok = (res: Response, data: unknown, meta?: Record<string, unknown>) =>
  res.json({ success: true, data: toSnake(data), ...(meta ? { meta } : {}) });
const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, error: { code: `E${status}`, message } });

/** GET /notifications — current user's inbox. */
const list = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user.id;
    const { unread, limit = '50', page = '1' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { userId };
    if (unread === 'true') where.isRead = false;
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const [total, items] = await Promise.all([
      (prisma as any).notification.count({ where }),
      (prisma as any).notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, items, { page: pageN, limit: limitN, total });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list notifications');
  }
};

/** GET /notifications/unread-count */
const unreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const count = await (prisma as any).notification.count({ where: { userId: req.user.id, isRead: false } });
    res.json({ count });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to count notifications');
  }
};

/** POST /notifications/:id/read — mark single */
const markRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const note = await (prisma as any).notification.findUnique({ where: { id } });
    if (!note || note.userId !== req.user.id) return fail(res, 404, 'Notification not found') as any;
    const updated = await (prisma as any).notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
    ok(res, updated);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to mark notification');
  }
};

/** POST /notifications/read-all */
const markAllRead = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = await (prisma as any).notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    ok(res, { count: r.count });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to mark notifications');
  }
};

/** DELETE /notifications/:id */
const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const note = await (prisma as any).notification.findUnique({ where: { id } });
    if (!note || note.userId !== req.user.id) return fail(res, 404, 'Notification not found') as any;
    await (prisma as any).notification.delete({ where: { id } });
    ok(res, { id, deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete notification');
  }
};

/**
 * DELETE /notifications        — wipe every notification in this user's inbox
 * DELETE /notifications?read=1 — wipe only the already-read ones
 */
const removeAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const where: Record<string, unknown> = { userId: req.user.id };
    if (req.query.read === '1' || req.query.read === 'true') where.isRead = true;
    const r = await (prisma as any).notification.deleteMany({ where });
    ok(res, { count: r.count });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete notifications');
  }
};

/**
 * POST /notifications/broadcast — admin/organiser fans out to all users whose
 * role matches one of `target_roles`. Empty target_roles ⇒ every user.
 */
const broadcast = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, message, type = 'info', category, link, target_roles, target_user_ids, metadata } = req.body;
    if (!title || !message) return fail(res, 400, 'title and message are required') as any;

    let userIds: string[] = [];
    if (Array.isArray(target_user_ids) && target_user_ids.length > 0) {
      userIds = target_user_ids;
    } else {
      const where: Record<string, unknown> = {};
      if (Array.isArray(target_roles) && target_roles.length > 0) {
        where.OR = [
          { role: { in: target_roles } },
          { userRoles: { some: { role: { in: target_roles } } } },
        ];
      }
      const users = await prisma.user.findMany({ where, select: { id: true } });
      userIds = users.map((u) => u.id);
    }

    if (userIds.length === 0) return fail(res, 400, 'No matching recipients') as any;

    const data = userIds.map((uid) => ({
      userId: uid,
      title,
      message,
      type,
      category: category ?? null,
      link: link ?? null,
      metadata: metadata ?? undefined,
    }));
    await (prisma as any).notification.createMany({ data });
    ok(res, { recipients: userIds.length });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to broadcast');
  }
};

export default { list, unreadCount, markRead, markAllRead, remove, removeAll, broadcast };
