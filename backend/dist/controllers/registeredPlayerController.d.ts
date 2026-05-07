import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    getRegisteredPlayers: (req: AuthRequest, res: Response) => Promise<void>;
    createRegisteredPlayer: (req: AuthRequest, res: Response) => Promise<void>;
    uploadPlayerPhoto: (req: AuthRequest, res: Response) => Promise<void>;
    updateRegisteredPlayer: (req: AuthRequest, res: Response) => Promise<void>;
    deletePlayerPhoto: (req: AuthRequest, res: Response) => Promise<void>;
    deletePlayer: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=registeredPlayerController.d.ts.map