import { Router } from 'express';

import authRoutes from './authRoutes';
import matchRoutes from './matchRoutes';
import playerRoutes from './playerRoutes';
import teamRoutes from './teamRoutes';
import tournamentRoutes from './tournamentRoutes';
import liveScoreRoutes from './liveScoreRoutes';
import publicRoutes from './publicRoutes';

const router = Router();

router.use('/api', authRoutes);
router.use('/api', matchRoutes);
router.use('/api', playerRoutes);
router.use('/api', teamRoutes);
router.use('/api', tournamentRoutes);
router.use('/api/live', liveScoreRoutes);
router.use('/api/public', publicRoutes);

export default router;
