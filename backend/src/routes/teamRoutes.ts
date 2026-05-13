import { Router } from 'express';
import teamController from '../controllers/teamController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', authenticate, teamController.getTeams as any);
router.get('/:id', authenticate, teamController.getTeamById as any);
router.get('/:id/stats', authenticate, teamController.getTeamStats as any);
router.post('/', authenticate, authorize(['admin']), teamController.createTeam as any);
router.put('/:id', authenticate, authorize(['admin']), teamController.updateTeam as any);
router.post('/:id/logo', authenticate, authorize(['admin']), upload.single('logo'), teamController.uploadTeamLogo as any);
router.delete('/:id/logo', authenticate, authorize(['admin']), teamController.deleteTeamLogo as any);
router.post('/:id/players', authenticate, authorize(['admin']), teamController.addPlayerToTeam as any);
router.put('/:teamId/players/:playerId/role', authenticate, authorize(['admin']), teamController.updatePlayerRole as any);
router.delete('/:teamId/players/:playerId', authenticate, authorize(['admin']), teamController.removePlayerFromTeam as any);

export default router;
