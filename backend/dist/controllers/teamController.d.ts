import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    getTeams: (_req: AuthRequest, res: Response) => Promise<void>;
    getTeamById: (req: AuthRequest, res: Response) => Promise<void>;
    createTeam: (req: AuthRequest, res: Response) => Promise<void>;
    addPlayerToTeam: (req: AuthRequest, res: Response) => Promise<void>;
    removePlayerFromTeam: (req: AuthRequest, res: Response) => Promise<void>;
    updateTeam: (req: AuthRequest, res: Response) => Promise<void>;
    updatePlayerRole: (req: AuthRequest, res: Response) => Promise<void>;
    uploadTeamLogo: (req: AuthRequest, res: Response) => Promise<void>;
    deleteTeamLogo: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=teamController.d.ts.map