import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { syncDolarVzlaRatesInDatabase, fetchDolarVzlaBcv } from '../services/dolarVzla.service';

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

export const createRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = rateSchema.parse(req.body);
    if (data.isActive) {
      await prisma.exchangeRate.updateMany({ data: { isActive: false } });
    }
    const rate = await prisma.exchangeRate.create({ data });
    res.status(201).json({ message: 'Tasa creada exitosamente', rate });
  } catch (error) {
    next(error);
  }
};

export const updateRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = rateSchema.partial().parse(req.body);
    if (data.isActive) {
      await prisma.exchangeRate.updateMany({ data: { isActive: false } });
    }
    const rate = await prisma.exchangeRate.update({
      where: { id },
      data
    });
    res.json({ message: 'Tasa actualizada exitosamente', rate });
  } catch (error) {
    next(error);
  }
};

export const setActiveRate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.exchangeRate.updateMany({ data: { isActive: false } });
    const rate = await prisma.exchangeRate.update({
      where: { id },
      data: { isActive: true }
    });
    res.json({ message: `Tasa '${rate.name}' establecida como activa`, rate });
  } catch (error) {
    next(error);
  }
};

export const syncDolarVzlaRates = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await syncDolarVzlaRatesInDatabase();
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
