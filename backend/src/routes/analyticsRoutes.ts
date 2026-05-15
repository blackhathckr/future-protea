import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import analytics from '../controllers/analyticsController';

const router = Router();
const STAFF = ['admin', 'tournament_organiser', 'coach'];

router.get('/overview',          authenticate, authorize(STAFF), analytics.overview        as any);
router.get('/matches-trend',     authenticate, authorize(STAFF), analytics.matchesTrend    as any);
router.get('/top-players',       authenticate,                   analytics.topPlayers      as any);
router.get('/role-distribution', authenticate, authorize(['admin']), analytics.roleDistribution as any);
router.get('/recent-activity',   authenticate, authorize(['admin']), analytics.recentActivity   as any);

export default router;
