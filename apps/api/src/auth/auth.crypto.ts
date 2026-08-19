import { createHash, randomBytes } from 'crypto';
import bcrypt from 'bcryptjs';

export const BCRYPT_ROUNDS = 12;
export const REFRESH_COOKIE_NAME = 'refresh_token';
export const REFRESH_COOKIE_PATH = '/api/auth';

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function generateRefreshToken(): string {
  return randomBytes(48).toString('hex');
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export function getAccessTokenTtl(): string {
  return process.env.JWT_ACCESS_EXPIRES_IN ?? '15m';
}

export function getRefreshTokenTtlMs(): number {
  const days = Number(process.env.JWT_REFRESH_EXPIRES_DAYS ?? 7);
  return days * 24 * 60 * 60 * 1000;
}

export function getRefreshExpiresAt(): Date {
  return new Date(Date.now() + getRefreshTokenTtlMs());
}

export function getRefreshCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  path: string;
  maxAge: number;
} {
  const raw = (process.env.COOKIE_SAMESITE ?? 'lax').trim().toLowerCase();
  const sameSite = raw === 'none' ? 'none' : raw === 'strict' ? 'strict' : 'lax';
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    path: REFRESH_COOKIE_PATH,
    maxAge: getRefreshTokenTtlMs(),
  };
}
