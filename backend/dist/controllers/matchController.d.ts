import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    getLiveMatches: (_req: Request, res: Response) => Promise<void>;
    getMatches: (req: AuthRequest, res: Response) => Promise<void>;
    getMatchById: (req: Request, res: Response) => Promise<void>;
    createMatch: (req: AuthRequest, res: Response) => Promise<void>;
    updateMatch: (req: AuthRequest, res: Response) => Promise<void>;
    getScorecard: (req: Request, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=matchController.d.ts.map