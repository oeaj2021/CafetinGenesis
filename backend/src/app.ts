import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes';
import { errorHandler } from './middlewares/error.middleware';
import { globalLimiter } from './middlewares/rateLimiter.middleware';
import { logger } from './utils/logger';

export const app = express();

// Security Headers with Helmet
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Global Rate Limiting
app.use(globalLimiter);

// Enable CORS for LAN access
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());

// Request Timing & Audit Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(req.method, req.originalUrl || req.url, res.statusCode, duration, ip);
  });

  next();
});

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api', routes);

// 404 Route Handler with Logging
app.use((req: Request, res: Response) => {
  logger.warn('ROUTE_NOT_FOUND', `Ruta inexistente solicitada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ message: `Ruta ${req.method} ${req.originalUrl} no encontrada.` });
});

// Global Error Handler
app.use(errorHandler);

