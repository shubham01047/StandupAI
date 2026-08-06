import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/auth';

/**
 * Middleware to authenticate requests via Bearer JWT access token in Authorization header
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Authentication required. No token provided.' });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired access token' });
    return;
  }
};
