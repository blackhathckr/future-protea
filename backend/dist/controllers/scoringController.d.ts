import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    recordBall: (req: AuthRequest, res: Response) => Promise<void>;
    getBalls: (req: Request, res: Response) => Promise<void>;
    deleteLastBall: (req: AuthRequest, res: Response) => Promise<void>;
    markRetiredHurt: (req: AuthRequest, res: Response) => Promise<void>;
    clearRetiredHurt: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=scoringController.d.ts.map