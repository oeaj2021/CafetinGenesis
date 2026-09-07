import { Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

export const getAuditLogs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { module, action, search, limit = '100', offset = '0' } = req.query;

    const where: any = {};
    if (module && typeof module === 'string' && module !== 'ALL') {
      where.module = module;
    }
    if (action && typeof action === 'string' && action !== 'ALL') {
      where.action = action;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { description: { contains: search } },
        { userName: { contains: search } },
        { ipAddress: { contains: search } }
      ];
    }

    const take = Math.min(parseInt(limit as string, 10) || 100, 500);
    const skip = parseInt(offset as string, 10) || 0;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip
      }),
      prisma.auditLog.count({ where })
    ]);

    res.json({ logs, total, limit: take, offset: skip });
  } catch (error) {
    next(error);
  }
};

export const getAuditStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalLogs = await prisma.auditLog.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogsCount = await prisma.auditLog.count({
      where: { createdAt: { gte: today } }
    });

    const recentCritical = await prisma.auditLog.findMany({
      where: {
        action: { in: ['DELETE', 'RATE_SYNC', 'CASH_CLOSE', 'UPDATE'] }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    res.json({ totalLogs, todayLogsCount, recentCritical });
  } catch (error) {
    next(error);
  }
};
