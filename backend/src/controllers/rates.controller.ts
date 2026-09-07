import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { syncDolarVzlaRatesInDatabase, fetchDolarVzlaBcv } from '../services/dolarVzla.service';
import { logAudit } from '../services/audit.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const rateSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  rate: z.number().positive('La tasa debe ser mayor a 0'),
  symbol: z.string().default('VES'),
  isActive: z.boolean().optional()
});

export const getRates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const rates = await prisma.exchangeRate.findMany({
      orderBy: { updatedAt: 'desc' }
    });
    const activeRate = rates.find(r => r.isActive) || rates[0] || null;
    res.json({ rates, activeRate });
  } catch (error) {
    next(error);
  }
};

export const getActiveRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let rate = await prisma.exchangeRate.findFirst({
      where: { isActive: true }
    });
    if (!rate) {
      rate = await prisma.exchangeRate.findFirst({
        orderBy: { updatedAt: 'desc' }
      });
    }
    res.json({ rate });
  } catch (error) {
    next(error);
  }
};

export const createRate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = rateSchema.parse(req.body);
    if (data.isActive) {
      await prisma.exchangeRate.updateMany({ data: { isActive: false } });
    }
    const rate = await prisma.exchangeRate.create({ data });

    logAudit({
      action: 'CREATE',
      module: 'RATES',
      description: `Creación de nueva tasa: ${rate.name} = ${rate.rate.toFixed(2)} Bs/$`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name,
      userRole: req.user?.role,
      ipAddress: req.ip,
      newValues: { name: rate.name, rate: rate.rate, isActive: rate.isActive }
    });

    res.status(201).json({ message: 'Tasa creada exitosamente', rate });
  } catch (error) {
    next(error);
  }
};

export const updateRate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const oldRate = await prisma.exchangeRate.findUnique({ where: { id } });
    const data = rateSchema.partial().parse(req.body);
    if (data.isActive) {
      await prisma.exchangeRate.updateMany({ data: { isActive: false } });
    }
    const rate = await prisma.exchangeRate.update({
      where: { id },
      data
    });

    logAudit({
      action: 'UPDATE',
      module: 'RATES',
      description: `Ajuste de tasa de cambio: ${rate.name} ➔ ${rate.rate.toFixed(2)} Bs/$ (anterior: ${oldRate?.rate?.toFixed(2)} Bs/$)`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name,
      userRole: req.user?.role,
      ipAddress: req.ip,
      oldValues: oldRate,
      newValues: rate
    });

    res.json({ message: 'Tasa actualizada exitosamente', rate });
  } catch (error) {
    next(error);
  }
};

export const setActiveRate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.exchangeRate.updateMany({ data: { isActive: false } });
    const rate = await prisma.exchangeRate.update({
      where: { id },
      data: { isActive: true }
    });

    logAudit({
      action: 'UPDATE',
      module: 'RATES',
      description: `Cambio de tasa activa a: "${rate.name}" (${rate.rate.toFixed(2)} Bs/$)`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name,
      userRole: req.user?.role,
      ipAddress: req.ip,
      newValues: { activeRate: rate.name, rate: rate.rate }
    });

    res.json({ message: `Tasa '${rate.name}' establecida como activa`, rate });
  } catch (error) {
    next(error);
  }
};

export const syncDolarVzlaRates = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await syncDolarVzlaRatesInDatabase();

    logAudit({
      action: 'RATE_SYNC',
      module: 'RATES',
      description: `Sincronización de tasa oficial BCV: ${result?.rate?.rate ? result.rate.rate.toFixed(2) : 'OK'} Bs/$`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name || 'Sistema Cron',
      userRole: req.user?.role,
      ipAddress: req.ip,
      metadata: result
    });

    res.json({
      message: 'Tasa BCV sincronizada en vivo con DolarVzla exitosamente',
      ...result
    });
  } catch (error: any) {
    res.status(500).json({
      message: 'Error al sincronizar con la API de DolarVzla',
      error: error.message
    });
  }
};
