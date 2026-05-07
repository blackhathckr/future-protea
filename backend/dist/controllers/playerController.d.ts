import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    getPlayers: (_req: AuthRequest, res: Response) => Promise<void>;
    approvePlayer: (req: AuthRequest, res: Response) => Promise<void>;
    getPlayerJourney: (req: AuthRequest, res: Response) => Promise<void>;
    getPlayerJourneyByName: (req: AuthRequest, res: Response) => Promise<void>;
    getMyProfile: (req: AuthRequest, res: Response) => Promise<void>;
    getAllPlayers: (_req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=playerController.d.ts.map