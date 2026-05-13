import { Router } from 'express';
import matchController from '../controllers/matchController';
import matchPlayerController from '../controllers/matchPlayerController';
import scoringController from '../controllers/scoringController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/public/live-matches', matchController.getLiveMatches as any);
router.get('/public/matches/:id', matchController.getMatchById as any);
router.get('/public/matches/:id/scorecard', matchController.getScorecard as any);
router.get('/public/matches/:id/balls', scoringController.getBalls as any);

router.get('/matches', authenticate, matchController.getMatches as any);
router.get('/matches/:id', authenticate, matchController.getMatchById as any);
router.post('/matches', authenticate, authorize(['feeder']), matchController.createMatch as any);
router.put('/matches/:id', authenticate, authorize(['feeder']), matchController.updateMatch as any);
router.get('/matches/:id/scorecard', authenticate, matchController.getScorecard as any);

router.post('/matches/:id/join', authenticate, authorize(['player']), matchPlayerController.joinMatch as any);
router.get('/matches/:id/players', authenticate, matchPlayerController.getMatchPlayers as any);
router.post('/matches/:id/populate-players', authenticate, authorize(['feeder']), matchPlayerController.populateMatchPlayers as any);
router.post('/matches/:id/dedupe-players', authenticate, authorize(['feeder']), matchPlayerController.dedupeMatchPlayers as any);
router.put('/match-players/:id/approve', authenticate, authorize(['feeder']), matchPlayerController.approveMatchPlayer as any);
router.get('/matches/:id/approved-players', authenticate, matchPlayerController.getApprovedPlayers as any);
router.put('/matches/:id/players/:playerId/toggle-playing', authenticate, authorize(['feeder']), matchPlayerController.togglePlaying as any);

router.post('/matches/:id/innings/:inningsNumber/setup', authenticate, authorize(['feeder']), matchController.setupInnings as any);
router.post('/matches/:id/innings/:inningsNumber/end', authenticate, authorize(['feeder']), matchController.endInnings as any);
router.post('/matches/:id/abandon', authenticate, authorize(['feeder']), scoringController.abandonMatch as any);
router.post('/matches/:id/penalty', authenticate, authorize(['feeder']), scoringController.penaltyRuns as any);

router.post('/matches/:id/ball', authenticate, authorize(['feeder']), scoringController.recordBall as any);
router.get('/matches/:id/balls', authenticate, scoringController.getBalls as any);
router.delete('/matches/:id/ball/last', authenticate, authorize(['feeder']), scoringController.deleteLastBall as any);
router.put('/matches/:matchId/players/:playerId/retired-hurt', authenticate, authorize(['feeder']), scoringController.markRetiredHurt as any);
router.delete('/matches/:matchId/players/:playerId/retired-hurt', authenticate, authorize(['feeder']), scoringController.clearRetiredHurt as any);

export default router;
