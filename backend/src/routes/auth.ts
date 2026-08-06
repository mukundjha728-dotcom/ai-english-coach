import { Router } from 'express';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { findOrCreateUser } from '../db/queries/users.js';
import { logger } from '../utils/logger.js';

export const authRouter = Router();

/**
 * POST /api/auth/session
 * Validates a Supabase token and returns/creates user profile.
 */
authRouter.post('/session', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await findOrCreateUser(req.user.id, req.user.email);

    res.json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        proficiencyLevel: user.proficiency_level,
      },
    });
  } catch (error) {
    logger.error('Auth session error', { error: String(error) });
    res.status(500).json({ error: 'Failed to create/fetch user session' });
  }
});
