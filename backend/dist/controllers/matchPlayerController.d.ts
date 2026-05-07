import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    joinMatch: (req: AuthRequest, res: Response) => Promise<void>;
    getMatchPlayers: (req: AuthRequest, res: Response) => Promise<void>;
    approveMatchPlayer: (req: AuthRequest, res: Response) => Promise<void>;
    getApprovedPlayers: (req: AuthRequest, res: Response) => Promise<void>;
    populateMatchPlayers: (req: AuthRequest, res: Response) => Promise<void>;
    dedupeMatchPlayers: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=matchPlayerController.d.ts.map