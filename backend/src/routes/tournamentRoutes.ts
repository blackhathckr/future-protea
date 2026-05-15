import { Router } from 'express';
import tournamentController from '../controllers/tournamentController';
import { authenticate, authorize } from '../middleware/auth';
import upload from '../middleware/upload';

const router = Router();

// Per BRD §6.8, the Tournament Organiser owns create / edit / fixtures / team
// assignment / logo management. Destructive DELETE remains admin-only.
const ORG_ROLES = ['admin', 'tournament_organiser'];

router.get('/', authenticate, tournamentController.getTournaments as any);
router.get('/:id', authenticate, tournamentController.getTournamentById as any);
router.post('/', authenticate, authorize(ORG_ROLES), tournamentController.createTournament as any);
router.post('/:id/teams', authenticate, authorize(ORG_ROLES), tournamentController.addTeamToTournament as any);
router.get('/:id/fixtures', authenticate, tournamentController.getTournamentFixtures as any);
router.post('/:id/fixtures', authenticate, authorize(ORG_ROLES), tournamentController.createFixture as any);
router.get('/:id/standings', authenticate, tournamentController.getTournamentStandings as any);
router.get('/:id/stats', authenticate, tournamentController.getTournamentStats as any);
router.put('/:id', authenticate, authorize(ORG_ROLES), tournamentController.updateTournament as any);
router.post('/:id/logo', authenticate, authorize(ORG_ROLES), upload.single('logo'), tournamentController.uploadTournamentLogo as any);
router.delete('/:id/logo', authenticate, authorize(ORG_ROLES), tournamentController.deleteTournamentLogo as any);
// Destructive — admin-only by design. Admin bypass in authorize() still applies.
router.delete('/:id', authenticate, authorize(['admin']), tournamentController.deleteTournament as any);

export default router;
