import dotenv from 'dotenv';

// Load environment variables FIRST (before any other imports)
// Suppress dotenv logs
const originalConsoleLog = console.log;
console.log = () => {};
dotenv.config();
console.log = originalConsoleLog;

import { createServer } from 'http';
import express from 'express';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// Socket.IO handlers
import { initializeSocketHandlers } from './server/lib/socket-handlers';

// API routes
import authRoutes from './server/routes/auth.routes';
import pointsRoutes from './server/routes/points.routes';
import uploadRoutes from './server/routes/upload.routes';

const dev = process.env.NODE_ENV !== 'production';
const PORT = process.env.PORT || 4000;

// Next.js setup
const app = next({ dev, dir: './' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const expressApp = express();
  const httpServer = createServer(expressApp);

  // CORS 설정
  const corsOrigin = process.env.CORS_ORIGIN || process.env.CLIENT_URL || 'http://localhost:4000';

  // Socket.IO setup
  const io = new SocketIOServer(httpServer, {
    path: '/socket',
    cors: {
      origin: corsOrigin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Express middleware
  expressApp.use(
    cors({
      origin: corsOrigin,
      credentials: true,
    })
  );
  expressApp.use(express.json());
  expressApp.use(express.urlencoded({ extended: false }));
  expressApp.use(cookieParser());

  // Health check
  expressApp.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'seoromal-globaltalk',
      timestamp: new Date().toISOString()
    });
  });

  // API routes
  expressApp.use('/auth', authRoutes);
  expressApp.use('/points', pointsRoutes);
  expressApp.use('/upload', uploadRoutes);

  // Initialize Socket.IO handlers
  initializeSocketHandlers(io);

  // Next.js handler for all other routes
  expressApp.all('*', (req, res) => {
    return handle(req, res);
  });

  // Start unified server
  httpServer.listen(PORT, () => {
    console.log(`🚀 SeRoMal Server running on http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  });
});
