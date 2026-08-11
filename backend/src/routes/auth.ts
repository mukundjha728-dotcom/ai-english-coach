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
        hasCompletedOnboarding: user.has_completed_onboarding,
      },
    });
  } catch (error) {
    logger.error('Auth session error', { error: String(error) });
    res.status(500).json({ error: 'Failed to create/fetch user session' });
  }
});

/**
 * POST /api/auth/onboarding
 * Marks the user's onboarding as completed.
 */
authRouter.post('/onboarding', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { completeOnboarding } = await import('../db/queries/users.js');
    
    // We need internal user ID. Let's find it first.
    const user = await findOrCreateUser(req.user.id);
    await completeOnboarding(user.id);

    res.json({ success: true });
  } catch (error) {
    logger.error('Auth onboarding error', { error: String(error) });
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

/**
 * GET /api/auth/stats
 * Returns user statistics (total sessions, etc).
 */
authRouter.get('/stats', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const { getUserStats } = await import('../db/queries/sessions.js');
    
    // We need internal user ID.
    const user = await findOrCreateUser(req.user.id);
    const stats = await getUserStats(user.id);

    res.json({
      totalSessions: stats.totalSessions,
      proficiencyLevel: user.proficiency_level
    });
  } catch (error) {
    logger.error('Auth stats error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});
