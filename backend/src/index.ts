import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { logger } from './utils/logger.js';
import { authRouter } from './routes/auth.js';
import { conversationRouter } from './routes/conversation.js';
import { documentRouter } from './routes/documents.js';
import { setupWebSocket } from './websocket/conversationWs.js';

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Middleware
app.use(cors({ 
  origin: function(origin, callback) {
    callback(null, true); // Dynamically allow all origins
  }, 
  credentials: true 
}));
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/conversation', conversationRouter);
app.use('/api/documents', documentRouter);

// Create HTTP server and attach WebSocket
const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Accepting requests from ${FRONTEND_URL}`);
});
