import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, JwtPayload } from '../utils/jwt.utils';
import { User } from '../models/User';
import { UserRole } from '../models/User';

// Augment Express Request
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload & { _id?: string };
    }
  }
}

/** Extract JWT from httpOnly cookie and attach user payload to req.user */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.accessToken as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }

    const payload = verifyAccessToken(token);

    // Verify user still exists and is active
    const user = await User.findById(payload.userId).lean();
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, message: 'User not found or disabled' });
      return;
    }

    req.user = { ...payload, _id: payload.userId };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/** Role-based authorization guard — call after authenticate */
export function authorize(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.user.role as UserRole)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${roles.join(', ')}`,
      });
      return;
    }
    next();
  };
}
