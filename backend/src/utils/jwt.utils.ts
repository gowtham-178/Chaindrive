import jwt from 'jsonwebtoken';
import { config } from '../config';
import { Types } from 'mongoose';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function generateRefreshToken(userId: string | Types.ObjectId): string {
  return jwt.sign({ userId: userId.toString() }, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiresIn as jwt.SignOptions['expiresIn'],
  });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, config.jwtSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): { userId: string } {
  return jwt.verify(token, config.jwtRefreshSecret) as { userId: string };
}

/** ms value for the access-token cookie max-age */
export function getAccessTokenTtlMs(): number {
  // parse simple formats like "15m", "1h", "7d"
  const str = config.jwtExpiresIn;
  const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 15 * 60_000;
  return parseInt(match[1]!, 10) * (units[match[2]!] ?? 60_000);
}

export function getRefreshTokenTtlMs(): number {
  const str = config.jwtRefreshExpiresIn;
  const units: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  const match = str.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 86_400_000;
  return parseInt(match[1]!, 10) * (units[match[2]!] ?? 86_400_000);
}
