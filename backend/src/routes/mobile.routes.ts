import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const router = Router();

/**
 * Endpoint de inicialización ultra-ligero para aplicaciones móviles (React Native, Flutter, Capacitor)
 * Retorna todos los datos esenciales en una sola petición HTTP.
 */
router.get('/bootstrap', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);

    const [
      activeRate,
      openShift,
      categories,
      totalProductsCount,
      lowStockCount,
      todayInvoicesCount,
      todaySalesAgg
    ] = await Promise.all([
      prisma.exchangeRate.findFirst({ where: { isActive: true } }),
      prisma.cashShift.findFirst({ where: { status: 'OPEN' } }),
      prisma.category.findMany({
        select: { id: true, name: true, _count: { select: { products: true } } },
        orderBy: { name: 'asc' }
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.count({ where: { stock: { lte: 5 }, isActive: true } }),
      prisma.invoice.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
      prisma.invoice.aggregate({
        _sum: { totalUSD: true, totalVES: true },
        where: { createdAt: { gte: startOfDay, lte: endOfDay } }
      })
    ]);

    const rate = activeRate?.rate || 1;

    res.json({
      app: {
        name: 'Cafetín Génesis',
        version: '1.2.0',
        environment: process.env.NODE_ENV || 'development',
        serverTime: new Date().toISOString()
      },
      exchangeRate: {
        id: activeRate?.id,
        name: activeRate?.name || 'BCV',
        rate: rate,
        symbol: activeRate?.symbol || 'VES',
        updatedAt: activeRate?.updatedAt
      },
      cashShift: openShift
        ? {
            isOpen: true,
            id: openShift.id,
            cashierName: openShift.cashierName,
            openedAt: openShift.openedAt,
            initialCashUSD: openShift.initialCashUSD,
            initialCashVES: openShift.initialCashVES
          }
        : {
            isOpen: false
          },
      categories,
      metricsToday: {
        salesCount: todayInvoicesCount,
        totalUSD: parseFloat((todaySalesAgg._sum.totalUSD || 0).toFixed(2)),
        totalVES: parseFloat((todaySalesAgg._sum.totalVES || 0).toFixed(2)),
        lowStockCount,
        totalProductsCount
      },
      businessInfo: {
        name: 'Cafetín Génesis',
        rif: 'J-50123456-7',
        phone: '+58 414-9998877',
        address: 'Av. Principal, Edificio Génesis, PB - Caracas',
        pagoMovil: {
          banco: '0134 - Banesco',
          rif: 'J-501234567',
          telefono: '04149998877'
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;
