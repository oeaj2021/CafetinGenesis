import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction): void => {
  console.error('[Error Middleware]:', err);

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

  const status = typeof err.status === 'number' ? err.status : 500;
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Error interno del servidor'
    : (err.message || 'Error interno del servidor');

  res.status(status).json({ message });
};
