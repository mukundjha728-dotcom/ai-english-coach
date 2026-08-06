import { Router } from 'express';
import multer from 'multer';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import { processPdfDocument } from '../services/documentProcessor.js';
import { getUserDocuments } from '../db/queries/documents.js';
import { logger } from '../utils/logger.js';

export const documentRouter = Router();

// Store files in memory so we can process them immediately
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

/**
 * POST /api/documents/upload
 * Expects a multipart form-data with a 'file' field containing a PDF.
 */
documentRouter.post('/upload', authMiddleware, upload.single('file'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    if (req.file.mimetype !== 'application/pdf') {
      res.status(400).json({ error: 'Only PDF files are supported' });
      return;
    }

    const documentId = await processPdfDocument(req.user.id, req.file.originalname, req.file.buffer);

    res.json({ success: true, documentId });
  } catch (error: any) {
    logger.error('Document upload error', { error: String(error) });
    res.status(500).json({ error: error.message || 'Failed to process document' });
  }
});

/**
 * GET /api/documents
 * Retrieves a list of documents uploaded by the user.
 */
documentRouter.get('/', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const documents = await getUserDocuments(req.user.id);
    res.json({ documents });
  } catch (error) {
    logger.error('Fetch documents error', { error: String(error) });
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});
