import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types';

export interface AuthRequest extends Request {
  user: JwtPayload;
}

const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }
  jwt.verify(token, process.env.JWT_SECRET as string, (err, decoded) => {
    if (err) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    const payload = decoded as JwtPayload;
    // Back-fill roles array for legacy tokens that only carry role string
    if (!payload.roles || payload.roles.length === 0) {
      payload.roles = payload.role ? [payload.role] : [];
    }
    (req as AuthRequest).user = payload;
    next();
  });
};

/**
 * Checks whether the authenticated user has at least one of the required roles.
 * Checks both:
 *   1. JWT payload roles[] array  (new multi-role tokens)
 *   2. JWT payload role string     (legacy single-role tokens — backward compat)
 * admin role bypasses all checks.
 */
const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction): void => {
  const user = (req as AuthRequest).user;
  const userRoles = user.roles?.length ? user.roles : [user.role];

  // admin bypasses all role gates
  if (userRoles.includes('admin')) {
    next();
    return;
  }

  const hasRole = roles.some((r) => userRoles.includes(r));
  if (!hasRole) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  next();
};

export { authenticate, authorize };
