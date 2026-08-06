import jwt, { Secret } from 'jsonwebtoken';
import crypto from 'crypto';
import { TokenPayload } from '../types/express';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret_key_67890';
const JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

/**
 * Generates short-lived Access Token (15 min default)
 */
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, JWT_ACCESS_SECRET as Secret, {
    expiresIn: JWT_ACCESS_EXPIRES_IN as any,
  });
};

/**
 * Generates long-lived Refresh Token (7 days default)
 */
export const generateRefreshToken = (payload: { userId: string }): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET as Secret, {
    expiresIn: JWT_REFRESH_EXPIRES_IN as any,
  });
};

/**
 * Verifies Access Token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, JWT_ACCESS_SECRET as Secret) as TokenPayload;
};

/**
 * Verifies Refresh Token
 */
export const verifyRefreshToken = (token: string): { userId: string } => {
  return jwt.verify(token, JWT_REFRESH_SECRET as Secret) as { userId: string };
};

/**
 * Hashes raw token string using SHA-256 for secure DB comparison
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};
