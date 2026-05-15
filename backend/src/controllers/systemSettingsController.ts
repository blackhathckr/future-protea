/**
 * @fileoverview System Settings + Maintenance Window controller. Settings are
 * stored as key/value rows so admins can drive feature flags and config from
 * the web UI without redeploying.
 */

import { Response } from 'express';
import os from 'os';
import prisma from '../config/database';
import { AuthRequest } from '../middleware/auth';
import toSnake from '../utils/toSnake';

const ok = (res: Response, data: unknown, meta?: Record<string, unknown>) =>
  res.json({ success: true, data: toSnake(data), ...(meta ? { meta } : {}) });
const fail = (res: Response, status: number, message: string) =>
  res.status(status).json({ success: false, error: { code: `E${status}`, message } });

const listSettings = async (_req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [rows, dbProbe] = await Promise.all([
      (prisma as any).systemSetting.findMany({ orderBy: [{ category: 'asc' }, { key: 'asc' }] }),
      prisma.$queryRaw`SELECT 1 as ok`.then(() => true).catch(() => false),
    ]);
    const uptimeSec = Math.floor(process.uptime());
    const mem = process.memoryUsage();
    const monitoring = {
      status: dbProbe ? 'healthy' : 'degraded',
      uptime_seconds: uptimeSec,
      database: dbProbe ? 'healthy' : 'unhealthy',
      memory: {
        rss_mb: Math.round(mem.rss / 1024 / 1024),
        heap_used_mb: Math.round(mem.heapUsed / 1024 / 1024),
        heap_total_mb: Math.round(mem.heapTotal / 1024 / 1024),
      },
      host: {
        platform: process.platform,
        node_version: process.version,
        cpu_count: os.cpus().length,
        load_average: os.loadavg(),
      },
      settings: rows,
    };
    ok(res, monitoring);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to fetch settings');
  }
};

const updateSetting = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const key = req.params.key as string;
    const { value, description, category } = req.body;
    if (value === undefined) return fail(res, 400, 'value required') as any;
    const setting = await (prisma as any).systemSetting.upsert({
      where: { key },
      update: { value: String(value), description: description ?? undefined, category: category ?? undefined, updatedBy: req.user?.id ?? null },
      create: { key, value: String(value), description: description ?? null, category: category ?? null, updatedBy: req.user?.id ?? null },
    });
    ok(res, setting);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to update setting');
  }
};

const listMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, page = '1', limit = '20' } = req.query as Record<string, string>;
    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    const pageN = Math.max(1, parseInt(page, 10) || 1);
    const limitN = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const [total, items] = await Promise.all([
      (prisma as any).maintenanceWindow.count({ where }),
      (prisma as any).maintenanceWindow.findMany({
        where,
        orderBy: { startsAt: 'desc' },
        skip: (pageN - 1) * limitN,
        take: limitN,
      }),
    ]);
    ok(res, items, { page: pageN, limit: limitN, total });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to list maintenance');
  }
};

const createMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, description, startsAt, endsAt, affectsServices = [], status = 'scheduled' } = req.body;
    if (!title || !startsAt || !endsAt) return fail(res, 400, 'title, startsAt, endsAt required') as any;
    const mw = await (prisma as any).maintenanceWindow.create({
      data: {
        title, description: description || null,
        startsAt: new Date(startsAt), endsAt: new Date(endsAt),
        affectsServices, status,
        createdById: req.user?.id ?? null,
      },
    });
    ok(res, mw);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to create maintenance window');
  }
};

const updateMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { title, description, startsAt, endsAt, affectsServices, status } = req.body;
    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (startsAt !== undefined) data.startsAt = new Date(startsAt);
    if (endsAt !== undefined) data.endsAt = new Date(endsAt);
    if (affectsServices !== undefined) data.affectsServices = affectsServices;
    if (status !== undefined) data.status = status;
    const mw = await (prisma as any).maintenanceWindow.update({ where: { id }, data });
    ok(res, mw);
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to update maintenance window');
  }
};

const deleteMaintenance = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await (prisma as any).maintenanceWindow.delete({ where: { id: req.params.id as string } });
    ok(res, { id: req.params.id, deleted: true });
  } catch (e: any) {
    fail(res, 500, e.message ?? 'Failed to delete maintenance window');
  }
};

export default {
  listSettings, updateSetting,
  listMaintenance, createMaintenance, updateMaintenance, deleteMaintenance,
};
