import { Router } from 'express';
import teamController from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/teams', authenticate, teamController.getTeams as any);
router.get('/teams/:id', authenticate, teamController.getTeamById as any);
router.post('/teams', authenticate, authorize(['feeder']), teamController.createTeam as any);
router.put('/teams/:id', authenticate, authorize(['feeder']), teamController.updateTeam as any);
router.post('/teams/:id/logo', authenticate, authorize(['feeder']), upload.single('logo'), teamController.uploadTeamLogo as any);
router.delete('/teams/:id/logo', authenticate, authorize(['feeder']), teamController.deleteTeamLogo as any);
router.post('/teams/:id/players', authenticate, authorize(['feeder']), teamController.addPlayerToTeam as any);
router.put('/teams/:teamId/players/:playerId/role', authenticate, authorize(['feeder']), teamController.updatePlayerRole as any);
router.delete('/teams/:teamId/players/:playerId', authenticate, authorize(['feeder']), teamController.removePlayerFromTeam as any);

export default router;
