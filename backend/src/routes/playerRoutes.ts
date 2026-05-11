import { Router } from 'express';
import playerController from '../controllers/playerController';
import registeredPlayerController from '../controllers/registeredPlayerController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/players/me/profile', authenticate, playerController.getMyProfile as any);
router.get('/players/all', authenticate, playerController.getAllPlayers as any);
router.get('/players/journey-by-name', authenticate, playerController.getPlayerJourneyByName as any);
router.get('/players', authenticate, authorize(['feeder']), playerController.getPlayers as any);
router.put('/players/:id/approve', authenticate, authorize(['feeder']), playerController.approvePlayer as any);
router.get('/players/:id/journey', authenticate, playerController.getPlayerJourney as any);

router.get('/registered-players', authenticate, registeredPlayerController.getRegisteredPlayers as any);
router.post('/registered-players/backfill-accounts', authenticate, authorize(['feeder']), registeredPlayerController.backfillPlayerAccounts as any);
router.post('/registered-players', authenticate, authorize(['feeder', 'player']), registeredPlayerController.createRegisteredPlayer as any);
router.post('/registered-players/:id/photo', authenticate, authorize(['feeder', 'player']), upload.single('photo'), registeredPlayerController.uploadPlayerPhoto as any);
router.put('/registered-players/:id', authenticate, authorize(['feeder', 'player']), registeredPlayerController.updateRegisteredPlayer as any);
router.delete('/registered-players/:id/photo', authenticate, authorize(['feeder', 'player']), registeredPlayerController.deletePlayerPhoto as any);
router.delete('/registered-players/:id', authenticate, authorize(['feeder', 'player']), registeredPlayerController.deletePlayer as any);

export default router;
