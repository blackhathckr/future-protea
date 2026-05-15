import { Router } from 'express';
import playerController from '../controllers/playerController';
import registeredPlayerController from '../controllers/registeredPlayerController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Public endpoints
router.post('/', playerController.createPlayer as any);

// Specific GET routes (must come before generic :id routes)
router.get('/me/profile', authenticate, playerController.getMyProfile as any);
router.get('/all', authenticate, playerController.getAllPlayers as any);
router.get('/journey-by-name', authenticate, playerController.getPlayerJourneyByName as any);
router.get('/top', authenticate, playerController.getTopPlayers as any);

// Generic GET route (admin only)
router.get('/', authenticate, authorize(['admin']), playerController.getPlayers as any);

// Specific :id routes (must come before generic :id routes)
router.get('/:id/journey', authenticate, playerController.getPlayerJourney as any);

// Generic :id routes (PUT, DELETE, POST)
router.post('/:id/approve', authenticate, authorize(['admin']), playerController.approvePlayer as any);
router.put('/:id', authenticate, authorize(['admin']), playerController.updatePlayer as any);
router.delete('/:id', authenticate, authorize(['admin']), playerController.deletePlayer as any);

// Registered players routes
router.get('/registered-players', authenticate, registeredPlayerController.getRegisteredPlayers as any);
router.post('/registered-players/backfill-accounts', authenticate, authorize(['admin']), registeredPlayerController.backfillPlayerAccounts as any);
router.post('/registered-players', authenticate, authorize(['admin', 'player']), registeredPlayerController.createRegisteredPlayer as any);
router.post('/registered-players/:id/photo', authenticate, authorize(['admin', 'player']), upload.single('photo'), registeredPlayerController.uploadPlayerPhoto as any);
router.put('/registered-players/:id', authenticate, authorize(['admin', 'player']), registeredPlayerController.updateRegisteredPlayer as any);
router.delete('/registered-players/:id/photo', authenticate, authorize(['admin', 'player']), registeredPlayerController.deletePlayerPhoto as any);
router.delete('/registered-players/:id', authenticate, authorize(['admin', 'player']), registeredPlayerController.deletePlayer as any);

export default router;
