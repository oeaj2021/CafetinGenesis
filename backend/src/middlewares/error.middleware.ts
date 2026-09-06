import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  const timestamp = new Date().toISOString();
  const status = typeof err.status === 'number' ? err.status : 500;
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';

  // Registrar error con visibilidad completa para Dokploy
  logger.error('CRITICAL_EXCEPTION', `Fallo procesando ${req.method} ${req.originalUrl || req.url}`, {
    timestamp,
    method: req.method,
    path: req.originalUrl || req.url,
    status,
    ip,
    errorMessage: err.message || 'Error desconocido',
    errorCode: err.code || 'N/A',
    stack: err.stack ? err.stack.split('\n').slice(0, 8).join('\n') : undefined
  });

  if (err instanceof ZodError) {
    res.status(400).json({
      message: 'Error de validación en los datos',
      errors: err.errors.map(e => ({ path: e.path.join('.'), message: e.message }))
    });
    return;
  }

  // Manejo de errores de unicidad o restricciones de Prisma
  if (err.code === 'P2002') {
    res.status(409).json({
      message: 'Conflicto: Ya existe un registro con estos datos únicos.'
    });
    return;
  }

  if (err.code === 'P2025') {
    res.status(404).json({
      message: 'El recurso solicitado no fue encontrado.'
    });
    return;
  }

  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : (err.message || 'Error interno del servidor');

  res.status(status).json({ message });
};

