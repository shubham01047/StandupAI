import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
} from '../utils/auth';

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['member', 'lead']).optional().default('member'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * Register a new user
 */
export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = signupSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { name, email, password, role } = parseResult.data;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role,
    });

    // Generate tokens
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      teamId: user.teamId ? user.teamId.toString() : null,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    // Store hashed refresh token in DB for secure revocation
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('[AuthController] Signup error:', error);
    res.status(500).json({ message: 'Server error during signup', error: error.message });
  }
};

/**
 * Log in existing user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: 'Validation failed',
        errors: parseResult.error.flatten().fieldErrors,
      });
      return;
    }

    const { email, password } = parseResult.data;

    // Explicitly select password field to compare credentials
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      teamId: user.teamId ? user.teamId.toString() : null,
      role: user.role,
    };

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken({ userId: user._id.toString() });

    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
        createdAt: user.createdAt,
      },
      accessToken,
      refreshToken,
    });
  } catch (error: any) {
    console.error('[AuthController] Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

/**
 * Obtain new access token via refresh token
 */
export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = refreshSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    const { refreshToken } = parseResult.data;

    let payload: { userId: string };
    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    const user = await User.findById(payload.userId).select('+refreshTokenHash');
    if (!user || !user.refreshTokenHash) {
      res.status(401).json({ message: 'User or refresh session not found' });
      return;
    }

    // Compare hash of incoming refresh token with DB stored hash
    const incomingHash = hashToken(refreshToken);
    if (incomingHash !== user.refreshTokenHash) {
      // Invalidate existing tokens on mismatch (token reuse detection)
      user.refreshTokenHash = undefined;
      await user.save();
      res.status(401).json({ message: 'Invalid refresh token reuse attempt' });
      return;
    }

    // Generate new Access + Refresh Token (Rotation)
    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      teamId: user.teamId ? user.teamId.toString() : null,
      role: user.role,
    };

    const newAccessToken = generateAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken({ userId: user._id.toString() });

    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    console.error('[AuthController] Refresh error:', error);
    res.status(500).json({ message: 'Server error during token refresh', error: error.message });
  }
};

/**
 * Log out user by invalidating refresh token
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      try {
        const payload = verifyRefreshToken(refreshToken);
        const user = await User.findById(payload.userId);
        if (user) {
          user.refreshTokenHash = undefined;
          await user.save();
        }
      } catch {
        // Ignore token verification error on logout
      }
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error: any) {
    console.error('[AuthController] Logout error:', error);
    res.status(500).json({ message: 'Server error during logout', error: error.message });
  }
};

/**
 * Get current authenticated user profile
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        teamId: user.teamId,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[AuthController] GetMe error:', error);
    res.status(500).json({ message: 'Server error retrieving profile', error: error.message });
  }
};
