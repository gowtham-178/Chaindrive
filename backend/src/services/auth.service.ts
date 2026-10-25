import bcrypt from 'bcryptjs';
import { User, IUser, UserRole } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt.utils';

export interface RegisterInput {
  email: string;
  password: string;
  role?: UserRole;
  fullName: string;
  phone: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    pincode: string;
  };
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const SALT_ROUNDS = 12;

export class AuthService {
  /** Register a new user and return tokens */
  async register(input: RegisterInput): Promise<{ user: IUser; tokens: AuthTokens }> {
    const existing = await User.findOne({ email: input.email.toLowerCase() });
    if (existing) {
      throw Object.assign(new Error('Email already registered'), { statusCode: 409 });
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    const user = await User.create({
      email: input.email.toLowerCase(),
      passwordHash,
      role: input.role ?? 'driver',
      profile: {
        fullName: input.fullName,
        phone: input.phone,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        address: input.address,
      },
    });

    const tokens = await this._issueTokens(user);
    return { user, tokens };
  }

  /** Login and return tokens */
  async login(input: LoginInput): Promise<{ user: IUser; tokens: AuthTokens }> {
    const user = await User.findOne({ email: input.email.toLowerCase() }).select('+passwordHash');
    if (!user) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }
    if (!user.isActive) {
      throw Object.assign(new Error('Account is disabled'), { statusCode: 403 });
    }

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) {
      throw Object.assign(new Error('Invalid email or password'), { statusCode: 401 });
    }

    const tokens = await this._issueTokens(user);
    return { user, tokens };
  }

  /** Refresh access token using a valid refresh token */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
    }

    const user = await User.findById(payload.userId).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      throw Object.assign(new Error('Refresh token reused or invalid'), { statusCode: 401 });
    }

    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });

    return { accessToken };
  }

  /** Logout: clear stored refresh token */
  async logout(userId: string): Promise<void> {
    await User.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
  }

  /** Update wallet address */
  async updateWalletAddress(userId: string, walletAddress: string): Promise<IUser> {
    const user = await User.findByIdAndUpdate(
      userId,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    );
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    return user;
  }

  // ── private ──────────────────────────────────────────────────────────────────

  private async _issueTokens(user: IUser): Promise<AuthTokens> {
    const accessToken = generateAccessToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    });
    const refreshToken = generateRefreshToken(user._id);

    // Persist refresh token (rotation)
    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  }
}

export const authService = new AuthService();
