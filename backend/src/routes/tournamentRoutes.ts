import { Router } from 'express';
import tournamentController from '../controllers/tournamentController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

router.get('/tournaments', authenticate, tournamentController.getTournaments as any);
router.get('/tournaments/:id', authenticate, tournamentController.getTournamentById as any);
router.post('/tournaments', authenticate, authorize(['feeder']), tournamentController.createTournament as any);
router.post('/tournaments/:id/teams', authenticate, authorize(['feeder']), tournamentController.addTeamToTournament as any);
router.get('/tournaments/:id/fixtures', authenticate, tournamentController.getTournamentFixtures as any);
router.get('/tournaments/:id/standings', authenticate, tournamentController.getTournamentStandings as any);
router.get('/tournaments/:id/stats', authenticate, tournamentController.getTournamentStats as any);
router.put('/tournaments/:id', authenticate, authorize(['feeder']), tournamentController.updateTournament as any);
router.post('/tournaments/:id/logo', authenticate, authorize(['feeder']), upload.single('logo'), tournamentController.uploadTournamentLogo as any);

export default router;
