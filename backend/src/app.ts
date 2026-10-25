import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';

import { config } from './config';
import { errorHandler, notFound } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

export function createApp() {
  const app = express();

  // ── Security ────────────────────────────────────────────────────────────────
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  // ── CORS ───────────────────────────────────────────────────────────────────
  app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ── Body / cookies ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // ── Rate limiting ──────────────────────────────────────────────────────────
  app.use('/api', generalLimiter);

  // ── Static uploads ─────────────────────────────────────────────────────────
  if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(config.uploadsDir));

  // ── Health check ───────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    const mongoose = require('mongoose');
    const states: Record<number, string> = {
      0: 'disconnected', 1: 'connected', 2: 'connecting', 3: 'disconnecting',
    };
    res.json({
      status: 'ok',
      service: 'ChainDrive API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      database: states[mongoose.connection.readyState] ?? 'unknown',
      environment: config.nodeEnv,
    });
  });

  // ── API routes ─────────────────────────────────────────────────────────────
  const authRoutes = require('./routes/auth.routes').default;
  const licenseRoutes = require('./routes/license.routes').default;
  const violationRoutes = require('./routes/violation.routes').default;
  const auditRoutes = require('./routes/audit.routes').default;

  app.use('/api/auth', authRoutes);
  app.use('/api/licenses', licenseRoutes);
  app.use('/api/violations', violationRoutes);
  app.use('/api/audit', auditRoutes);

  // ── 404 + error handler ────────────────────────────────────────────────────
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
