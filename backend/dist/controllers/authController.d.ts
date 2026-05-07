import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
declare const _default: {
    register: (req: AuthRequest, res: Response) => Promise<void>;
    login: (req: AuthRequest, res: Response) => Promise<void>;
    getMe: (req: AuthRequest, res: Response) => Promise<void>;
    updateProfile: (req: AuthRequest, res: Response) => Promise<void>;
    uploadProfilePhoto: (req: AuthRequest, res: Response) => Promise<void>;
    deleteProfilePhoto: (req: AuthRequest, res: Response) => Promise<void>;
    changePassword: (req: AuthRequest, res: Response) => Promise<void>;
    forgotPassword: (req: AuthRequest, res: Response) => Promise<void>;
    resetPassword: (req: AuthRequest, res: Response) => Promise<void>;
};
export default _default;
//# sourceMappingURL=authController.d.ts.map