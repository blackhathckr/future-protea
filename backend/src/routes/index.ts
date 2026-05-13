import { Router } from 'express';

import authRoutes from './authRoutes';
import matchRoutes from './matchRoutes';
import playerRoutes from './playerRoutes';
import teamRoutes from './teamRoutes';
import tournamentRoutes from './tournamentRoutes';
import liveScoreRoutes from './liveScoreRoutes';
import publicRoutes from './publicRoutes';
import notificationRoutes from './notificationRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/matches', matchRoutes);
router.use('/players', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/tournaments', tournamentRoutes);
router.use('/live', liveScoreRoutes);
router.use('/public', publicRoutes);
router.use('/notifications', notificationRoutes);

export default router;
