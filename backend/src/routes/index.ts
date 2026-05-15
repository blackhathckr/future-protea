import { Router } from 'express';

import authRoutes from './authRoutes';
import matchRoutes from './matchRoutes';
import playerRoutes from './playerRoutes';
import teamRoutes from './teamRoutes';
import tournamentRoutes from './tournamentRoutes';
import liveScoreRoutes from './liveScoreRoutes';
import publicRoutes from './publicRoutes';
import notificationRoutes from './notificationRoutes';
import adminRoutes from './adminRoutes';
import analyticsRoutes from './analyticsRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/matches', matchRoutes);
router.use('/players', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/live', liveScoreRoutes);
router.use('/public', publicRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

// Admin user-management gateway — handles users, roles, permissions,
// announcements, support tickets, system settings, audit logs.
router.use('/users', adminRoutes);

export default router;
