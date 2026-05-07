import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    getTournaments: (req: AuthRequest, res: Response) => Promise<void>;
    getTournamentById: (req: AuthRequest, res: Response) => Promise<void>;
    createTournament: (req: AuthRequest, res: Response) => Promise<void>;
    updateTournament: (req: AuthRequest, res: Response) => Promise<void>;
    addTeamToTournament: (req: AuthRequest, res: Response) => Promise<void>;
    getTournamentFixtures: (req: AuthRequest, res: Response) => Promise<void>;
    getTournamentStandings: (req: AuthRequest, res: Response) => Promise<void>;
    getTournamentStats: (req: AuthRequest, res: Response) => Promise<void>;
    uploadTournamentLogo: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=tournamentController.d.ts.map