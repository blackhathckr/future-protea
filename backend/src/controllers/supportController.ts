/**
 * @fileoverview Support ticket controller — CRUD + responses + escalate + resolve.
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
    const { status, priority, escalated, search, page = '1', limit = '20', assignedTo } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (escalated === 'true') where.escalated = true;
    if (assignedTo) where.assignedToId = assignedTo;
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const [total, items] = await Promise.all([
      (prisma as any).supportTicket.count({ where }),
      (prisma as any).supportTicket.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, items, { page: pageN, limit: limitN, total });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list tickets');
  }
};

const getOne = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticket = await (prisma as any).supportTicket.findUnique({
      where: { id: req.params.id as string },
      // Internal notes are admin-only; we strip them below for the reporter.
      include: { responses: { orderBy: { createdAt: 'asc' } } },
    });
    if (!ticket) return fail(res, 404, 'Ticket not found') as any;
    // Reporters can read their own tickets; admins can read everything.
    const isAdmin = (req.user.roles ?? [req.user.role]).includes('admin');
    if (!isAdmin && ticket.reporterId !== req.user.id) {
      return fail(res, 403, 'Not allowed') as any;
    }
    if (!isAdmin) {
      ticket.responses = (ticket.responses ?? []).filter((r: any) => !r.isInternal);
    }
    ok(res, ticket);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch ticket');
  }
};

/** GET /support-tickets/mine — tickets the signed-in user filed. */
const listMine = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '50' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = { reporterId: req.user.id };
    if (status) where.status = status;
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(200, Math.max(1, parseInt(limit, 10) || 50));
    const [total, items] = await Promise.all([
      (prisma as any).supportTicket.count({ where }),
      (prisma as any).supportTicket.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, items, { page: pageN, limit: limitN, total });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list my tickets');
  }
};

const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { subject, description, category, priority = 'normal' } = req.body;
    if (!subject || !description) return fail(res, 400, 'subject and description required') as any;
    const reporter = await prisma.user.findUnique({ where: { id: req.user.id }, select: { email: true } });
    const ticket = await (prisma as any).supportTicket.create({
      data: {
        subject, description, category: category || null, priority,
        reporterId: req.user.id,
        reporterEmail: reporter?.email || null,
      },
    });

    // Best-effort: notify every admin so they see the new ticket in their bell.
    try {
      const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
      if (admins.length > 0) {
        await (prisma as any).notification.createMany({
          data: admins.map((a) => ({
            userId: a.id,
            title: `New ticket: ${ticket.subject}`,
            message: `${reporter?.email ?? 'A user'} filed a ${ticket.priority}-priority ticket.`,
            type: ticket.priority === 'urgent' || ticket.priority === 'high' ? 'warning' : 'info',
            category: 'system',
            link: '/support',
            metadata: { ticket_id: ticket.id },
          })),
        });
      }
    } catch { /* notification best-effort */ }

    ok(res, ticket);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to create ticket');
  }
};

const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { subject, description, status, priority, category, assignedTo } = req.body;
    const data: Record<string, unknown> = {};
    if (subject !== undefined) data.subject = subject;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (category !== undefined) data.category = category;
    if (assignedTo !== undefined) data.assignedToId = assignedTo || null;
    const t = await (prisma as any).supportTicket.update({ where: { id }, data });
    ok(res, t);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to update ticket');
  }
};

const escalate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { reason } = req.body;
    const t = await (prisma as any).supportTicket.update({
      where: { id },
      data: { escalated: true, priority: 'high', escalationReason: reason || null },
    });
    ok(res, t);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to escalate ticket');
  }
};

const resolve = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const t = await (prisma as any).supportTicket.update({
      where: { id },
      data: { status: 'resolved', resolvedAt: new Date() },
    });
    ok(res, t);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to resolve ticket');
  }
};

const addResponse = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const ticketId = req.params.id as string;
    const { message, isInternal = false } = req.body;
    if (!message) return fail(res, 400, 'message required') as any;

    // Reporter can reply to their own ticket; admin can reply to any.
    const ticket = await (prisma as any).supportTicket.findUnique({ where: { id: ticketId } });
    if (!ticket) return fail(res, 404, 'Ticket not found') as any;
    const isAdmin = (req.user.roles ?? [req.user.role]).includes('admin');
    if (!isAdmin && ticket.reporterId !== req.user.id) {
      return fail(res, 403, 'Not allowed') as any;
    }
    // Only admins can post internal notes.
    const internalFlag = isAdmin ? !!isInternal : false;

    const author = await prisma.user.findUnique({ where: { id: req.user.id }, select: { name: true } });
    const r = await (prisma as any).ticketResponse.create({
      data: {
        ticketId,
        authorId: req.user.id,
        authorName: author?.name ?? null,
        message,
        isInternal: internalFlag,
      },
    });
    // Bump ticket updatedAt + status if it was closed
    await (prisma as any).supportTicket.update({
      where: { id: ticketId },
      data: { status: 'in_progress' },
    }).catch(() => {});

    // Notify the OTHER party (admin notified on user reply, reporter notified on admin reply)
    try {
      if (isAdmin && ticket.reporterId) {
        await (prisma as any).notification.create({
          data: {
            userId: ticket.reporterId,
            title: `Support: ${ticket.subject}`,
            message: 'You have a new reply on your ticket.',
            type: 'info',
            category: 'system',
            link: `/support/tickets/${ticketId}`,
            metadata: { ticket_id: ticketId },
          },
        });
      } else if (!isAdmin) {
        const admins = await prisma.user.findMany({ where: { role: 'admin' }, select: { id: true } });
        if (admins.length > 0) {
          await (prisma as any).notification.createMany({
            data: admins.map((a) => ({
              userId: a.id,
              title: `Reply on "${ticket.subject}"`,
              message: 'A user replied to a support ticket.',
              type: 'info',
              category: 'system',
              link: `/support`,
              metadata: { ticket_id: ticketId },
            })),
          });
        }
      }
    } catch { /* notification is best-effort */ }

    ok(res, r);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to add response');
  }
};

const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await (prisma as any).supportTicket.delete({ where: { id: req.params.id as string } });
    ok(res, { id: req.params.id, deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete ticket');
  }
};

export default { list, listMine, getOne, create, update, escalate, resolve, addResponse, remove };
