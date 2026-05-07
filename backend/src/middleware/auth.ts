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
    (req as AuthRequest).user = decoded as JwtPayload;
    next();
  });
};

const authorize = (roles: string[]) => (req: Request, res: Response, next: NextFunction): void => {
  if (!roles.includes((req as AuthRequest).user.role)) {
    res.status(403).json({ error: 'Insufficient permissions' });
    return;
  }
  next();
};

export { authenticate, authorize };
