import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export type Role = 
  | 'GOVERNMENT_ADMIN' 
  | 'ANALYST' 
  | 'COURSE_MANAGER' 
  | 'TRAINEE' 
  | 'EMPLOYER' 
  | 'TRAINING_PROVIDER' 
  | 'TRAINER';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  status?: string;
  organizationId?: string;
  traineeId?: string;
  trainerId?: string;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'fallback_secret_do_not_use_in_prod';
    const decoded = jwt.verify(token, secret) as AuthUser;
    
    // Check if account status is suspended or rejected
    if (decoded.status === 'SUSPENDED') {
      return res.status(403).json({ error: 'Forbidden: Account has been suspended by Administrator.' });
    }
    if (decoded.status === 'REJECTED') {
      return res.status(403).json({ error: 'Forbidden: Registration application was rejected.' });
    }
    if (decoded.status === 'PENDING' || decoded.status === 'UNDER_REVIEW') {
      return res.status(403).json({ error: 'Forbidden: Account is pending Administrator approval.' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

export const authorize = (roles: Role[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient privileges for this operation' });
    }
    next();
  };
};
