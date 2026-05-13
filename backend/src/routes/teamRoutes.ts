import { Router } from 'express';
import teamController from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/teams', authenticate, teamController.getTeams as any);
router.get('/teams/:id', authenticate, teamController.getTeamById as any);
router.get('/teams/:id/stats', authenticate, teamController.getTeamStats as any);
router.post('/teams', authenticate, authorize(['admin']), teamController.createTeam as any);
router.put('/teams/:id', authenticate, authorize(['admin']), teamController.updateTeam as any);
router.delete('/teams/:id', authenticate, authorize(['admin']), teamController.deleteTeam as any);
router.post('/teams/:id/logo', authenticate, authorize(['admin']), upload.single('logo'), teamController.uploadTeamLogo as any);
router.delete('/teams/:id/logo', authenticate, authorize(['admin']), teamController.deleteTeamLogo as any);
router.post('/teams/:id/players', authenticate, authorize(['admin']), teamController.addPlayerToTeam as any);
router.put('/teams/:teamId/players/:playerId/role', authenticate, authorize(['admin']), teamController.updatePlayerRole as any);
router.delete('/teams/:teamId/players/:playerId', authenticate, authorize(['admin']), teamController.removePlayerFromTeam as any);

export default router;
