import { Router } from 'express';
import tournamentController from '../controllers/tournamentController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/', authenticate, tournamentController.getTournaments as any);
router.get('/:id', authenticate, tournamentController.getTournamentById as any);
router.post('/', authenticate, authorize(['admin']), tournamentController.createTournament as any);
router.post('/:id/teams', authenticate, authorize(['admin']), tournamentController.addTeamToTournament as any);
router.get('/:id/fixtures', authenticate, tournamentController.getTournamentFixtures as any);
router.get('/:id/standings', authenticate, tournamentController.getTournamentStandings as any);
router.get('/:id/stats', authenticate, tournamentController.getTournamentStats as any);
router.put('/:id', authenticate, authorize(['admin']), tournamentController.updateTournament as any);
router.post('/:id/logo', authenticate, authorize(['admin']), upload.single('logo'), tournamentController.uploadTournamentLogo as any);

export default router;
