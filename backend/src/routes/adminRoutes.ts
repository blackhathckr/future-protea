/**
 * @fileoverview Admin routes — everything the web admin panel calls under
 * /api/users/* lives here. Roles, permissions, announcements, support tickets,
 * settings, maintenance windows, audit logs.
 *
 * Mounted at /api/users (matches the web admin service URLs).
 */

import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import userAdmin from '../controllers/userAdminController';
import roleAdmin from '../controllers/roleAdminController';
import announcements from '../controllers/announcementController';
import support from '../controllers/supportController';
import settings from '../controllers/systemSettingsController';

const router = Router();
const ADMIN = ['admin'];

// ─── Users CRUD ────────────────────────────────────────────────────────────
router.get('/',                   authenticate, authorize(ADMIN), userAdmin.listUsers       as any);
router.post('/',                  authenticate, authorize(ADMIN), userAdmin.createUser      as any);
router.post('/bulk',              authenticate, authorize(ADMIN), userAdmin.bulkUploadUsers as any);
router.post('/bulk-delete',       authenticate, authorize(ADMIN), userAdmin.bulkDeleteUsers as any);

// ─── Roles & Permissions ───────────────────────────────────────────────────
router.get('/roles',              authenticate, authorize(ADMIN), roleAdmin.listRoles        as any);
router.post('/roles',             authenticate, authorize(ADMIN), roleAdmin.createRole       as any);
router.get('/roles/:id',          authenticate, authorize(ADMIN), roleAdmin.getRole          as any);
router.patch('/roles/:id',        authenticate, authorize(ADMIN), roleAdmin.updateRole       as any);
router.delete('/roles/:id',       authenticate, authorize(ADMIN), roleAdmin.deleteRole       as any);

router.get('/permissions',        authenticate, authorize(ADMIN), roleAdmin.listPermissions  as any);
router.post('/permissions',       authenticate, authorize(ADMIN), roleAdmin.createPermission as any);

// ─── Announcements ─────────────────────────────────────────────────────────
router.get('/announcements',                 authenticate, authorize(ADMIN), announcements.list       as any);
router.get('/announcements/active',          authenticate,                   announcements.listActiveForUser as any);
router.post('/announcements',                authenticate, authorize(ADMIN), announcements.create     as any);
router.get('/announcements/:id',             authenticate, authorize(ADMIN), announcements.getOne     as any);
router.put('/announcements/:id',             authenticate, authorize(ADMIN), announcements.update     as any);
router.delete('/announcements/:id',          authenticate, authorize(ADMIN), announcements.remove     as any);
router.put('/announcements/:id/publish',     authenticate, authorize(ADMIN), announcements.publish    as any);
router.put('/announcements/:id/unpublish',   authenticate, authorize(ADMIN), announcements.unpublish  as any);

// ─── Support Tickets ───────────────────────────────────────────────────────
// Any authenticated user can create + view their own tickets via this gateway,
// but admin gating applies to listing/updating/deleting.
router.get('/support-tickets',               authenticate, authorize(ADMIN), support.list        as any);
router.post('/support-tickets',              authenticate,                   support.create      as any);
// "My tickets" must come before /:id so it's not swallowed by the id route.
router.get('/support-tickets/mine',          authenticate,                   support.listMine    as any);
// Detail is auth-only; the controller enforces reporter-or-admin ownership.
router.get('/support-tickets/:id',           authenticate,                   support.getOne      as any);
router.put('/support-tickets/:id',           authenticate, authorize(ADMIN), support.update      as any);
router.delete('/support-tickets/:id',        authenticate, authorize(ADMIN), support.remove      as any);
router.put('/support-tickets/:id/escalate',  authenticate, authorize(ADMIN), support.escalate    as any);
router.put('/support-tickets/:id/resolve',   authenticate, authorize(ADMIN), support.resolve     as any);
router.post('/support-tickets/:id/responses', authenticate,                  support.addResponse as any);

// ─── System Settings + Maintenance Windows ────────────────────────────────
router.get('/settings',                       authenticate, authorize(ADMIN), settings.listSettings       as any);
router.put('/settings/:key',                  authenticate, authorize(ADMIN), settings.updateSetting      as any);
router.get('/settings/maintenance',           authenticate, authorize(ADMIN), settings.listMaintenance    as any);
router.post('/settings/maintenance',          authenticate, authorize(ADMIN), settings.createMaintenance  as any);
router.put('/settings/maintenance/:id',       authenticate, authorize(ADMIN), settings.updateMaintenance  as any);
router.delete('/settings/maintenance/:id',    authenticate, authorize(ADMIN), settings.deleteMaintenance  as any);

// ─── Audit Logs (used by SystemSettings tabs & UserManagement audit tab) ───
router.get('/audit-logs',                     authenticate, authorize(ADMIN), userAdmin.getAuditLogs    as any);
router.get('/audit-logs/modules',             authenticate, authorize(ADMIN), userAdmin.getAuditModules as any);

// ─── Per-user routes (last so `/audit-logs`, `/roles` etc don't fall through) ──
router.get('/:id',                authenticate, authorize(ADMIN), userAdmin.getUser    as any);
router.patch('/:id',              authenticate, authorize(ADMIN), userAdmin.updateUser as any);
router.delete('/:id',             authenticate, authorize(ADMIN), userAdmin.deleteUser as any);

export default router;
