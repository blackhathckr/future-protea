import { Router } from 'express';
import matchController from '../controllers/matchController';
import matchPlayerController from '../controllers/matchPlayerController';
import scoringController from '../controllers/scoringController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, matchController.getMatches as any);
router.get('/:id', authenticate, matchController.getMatchById as any);
router.post('/', authenticate, authorize(['feeder']), matchController.createMatch as any);
router.put('/:id', authenticate, authorize(['feeder']), matchController.updateMatch as any);
router.get('/:id/scorecard', authenticate, matchController.getScorecard as any);

router.post('/:id/join', authenticate, authorize(['player']), matchPlayerController.joinMatch as any);
router.get('/:id/players', authenticate, matchPlayerController.getMatchPlayers as any);
router.post('/:id/populate-players', authenticate, authorize(['feeder']), matchPlayerController.populateMatchPlayers as any);
router.post('/:id/dedupe-players', authenticate, authorize(['feeder']), matchPlayerController.dedupeMatchPlayers as any);
router.put('/match-players/:id/approve', authenticate, authorize(['feeder']), matchPlayerController.approveMatchPlayer as any);
router.get('/:id/approved-players', authenticate, matchPlayerController.getApprovedPlayers as any);

router.post('/:id/ball', authenticate, authorize(['feeder']), scoringController.recordBall as any);
router.get('/:id/balls', authenticate, scoringController.getBalls as any);
router.delete('/:id/ball/last', authenticate, authorize(['feeder']), scoringController.deleteLastBall as any);
router.put('/:matchId/players/:playerId/retired-hurt', authenticate, authorize(['feeder']), scoringController.markRetiredHurt as any);
router.delete('/:matchId/players/:playerId/retired-hurt', authenticate, authorize(['feeder']), scoringController.clearRetiredHurt as any);

export default router;
