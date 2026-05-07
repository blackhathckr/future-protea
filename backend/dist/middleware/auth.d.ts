import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from '../types';
export interface AuthRequest extends Request {
    user: JwtPayload;
}
declare const authenticate: (req: Request, res: Response, next: NextFunction) => void;
declare const authorize: (roles: string[]) => (req: Request, res: Response, next: NextFunction) => void;
export { authenticate, authorize };
//# sourceMappingURL=auth.d.ts.map