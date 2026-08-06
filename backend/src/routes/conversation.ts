import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { rateLimit } from '../middleware/rateLimit.js';
import { createSession } from '../db/queries/sessions.js';
import { findOrCreateUser } from '../db/queries/users.js';
import { generateSessionScorecard } from '../services/scorecardGenerator.js';
import { getScorecardBySessionId } from '../db/queries/scorecards.js';
import { logger } from '../utils/logger.js';

export const conversationRouter = Router();

const startConversationSchema = z.object({
  sessionType: z.string().default('conversation'),
});

/**
 * POST /api/conversation/start
 * Creates a new conversation session and returns sessionId.
 * Protected by auth + rate limiting.
 */
conversationRouter.post(
  '/start',
  authMiddleware,
  rateLimit,
  async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const parsed = startConversationSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid request', details: parsed.error.issues });
        return;
      }

      // Ensure user exists in our DB
      const user = await findOrCreateUser(req.user.id, req.user.email);

      // Create session
      const session = await createSession(user.id, parsed.data.sessionType);

      res.json({
        sessionId: session.id,
        wsUrl: `/ws/conversation/${session.id}`,
      });
    } catch (error) {
      logger.error('Start conversation error', { error: String(error) });
      res.status(500).json({ error: 'Failed to start conversation' });
    }
  }
);

// POST /api/conversation/:sessionId/scorecard
conversationRouter.post('/:sessionId/scorecard', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { sessionId } = req.params;
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    const scorecard = await generateSessionScorecard(sessionId as string, req.user.id);
    res.json({ scorecard });
  } catch (error) {
    logger.error('Generate scorecard error', { error: String(error) });
    res.status(500).json({ error: 'Failed to generate scorecard' });
  }
});

// GET /api/conversation/:sessionId/scorecard
conversationRouter.get('/:sessionId/scorecard', authMiddleware, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const scorecard = await getScorecardBySessionId(sessionId as string);
    if (!scorecard) {
      res.status(404).json({ error: 'Scorecard not found' });
      return;
    }
    res.json({ scorecard });
  } catch (error) {
    logger.error('Fetch scorecard error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch scorecard' });
  }
});

/**
 * GET /api/scores/:sessionId
 * Placeholder for later phases — returns empty scores for now.
 */
conversationRouter.get('/scores/:sessionId', authMiddleware, async (_req, res) => {
  res.json({ scores: null, message: 'Scoring not yet implemented' });
});
