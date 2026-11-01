import express from 'express';
import cors from 'cors';
import agentRoutes from './routes/agentRoutes.js';
import { requireAuthentication } from './middleware/authenticationMiddleware.js';

export const app = express();

// Allow the Vite frontend to call the backend during local development.
app.use(cors({ origin: process.env.FRONTEND_URL || true }));
app.use(express.json({ limit: '1mb' }));

// Simple health check for local/deployed monitoring.
app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'FresherAI backend' }));

// Record total API latency without logging request bodies or credentials.
function logApiDuration(req, res, next) {
  const startedAt = process.hrtime.bigint();
  res.once('finish', () => {
    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    console.info('[fresherai] API request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: Math.round(durationMs),
    });
  });
  next();
}

// Every application API request is authenticated before it reaches a route.
app.use('/api', logApiDuration, requireAuthentication, agentRoutes);
