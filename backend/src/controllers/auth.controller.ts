import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { authService } from '../services/auth.service';
import { User } from '../models/User';
import {
  getAccessTokenTtlMs,
  getRefreshTokenTtlMs,
} from '../utils/jwt.utils';
import { config } from '../config';

// ── Validation schemas ────────────────────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'officer', 'driver']).optional().default('driver'),
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  dateOfBirth: z.string().optional(),
  address: z
    .object({
      street: z.string(),
      city: z.string(),
      state: z.string(),
      pincode: z.string(),
    })
    .optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const walletSchema = z.object({
  walletAddress: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address'),
});

// ── Cookie helpers ────────────────────────────────────────────────────────────

function setAuthCookies(
  res: Response,
  accessToken: string,
  refreshToken: string
) {
  const isProduction = config.isProduction;
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: getAccessTokenTtlMs(),
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: getRefreshTokenTtlMs(),
    path: '/api/auth/refresh',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
}

// ── Controller ───────────────────────────────────────────────────────────────

/** POST /api/auth/register */
export async function register(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = registerSchema.parse(req.body);
    const { user, tokens } = await authService.register(data);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: { user },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    next(err);
  }
}

/** POST /api/auth/login */
export async function login(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const data = loginSchema.parse(req.body);
    const { user, tokens } = await authService.login(data);
    setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
    res.json({
      success: true,
      message: 'Login successful',
      data: { user },
    });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    next(err);
  }
}

/** POST /api/auth/refresh */
export async function refresh(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = req.cookies?.refreshToken as string | undefined;
    if (!token) {
      res.status(401).json({ success: false, message: 'Refresh token required' });
      return;
    }
    const { accessToken } = await authService.refreshAccessToken(token);
    const isProduction = config.isProduction;
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: getAccessTokenTtlMs(),
    });
    res.json({ success: true, message: 'Token refreshed' });
  } catch (err) {
    next(err);
  }
}

/** POST /api/auth/logout */
export async function logout(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (req.user) {
      await authService.logout(req.user.userId);
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
}

/** GET /api/auth/me */
export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await User.findById(req.user!.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, data: { user } });
  } catch (err) {
    next(err);
  }
}

/** PATCH /api/auth/wallet */
export async function updateWallet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { walletAddress } = walletSchema.parse(req.body);
    const user = await authService.updateWalletAddress(req.user!.userId, walletAddress);
    res.json({ success: true, message: 'Wallet address updated', data: { user } });
  } catch (err) {
    if (err instanceof ZodError) {
      res.status(422).json({ success: false, message: 'Validation error', errors: err.errors });
      return;
    }
    next(err);
  }
}
