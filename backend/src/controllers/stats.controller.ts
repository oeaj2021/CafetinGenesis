import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const getDashboardStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { period = 'day', date } = req.query;

    const baseDate = date ? new Date(date as string) : new Date();
    let startDate: Date;
    let endDate: Date;

    if (period === 'day') {
      startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
      endDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
    } else if (period === 'month') {
      startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1, 0, 0, 0, 0);
      endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === 'year') {
      startDate = new Date(baseDate.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate = new Date(baseDate.getFullYear(), 11, 31, 23, 59, 59, 999);
    } else {
      // Default day
      startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 0, 0, 0, 0);
      endDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 23, 59, 59, 999);
    }

    const [
      activeRate,
      invoices,
      purchases,
      allPendingDebts,
      totalProducts,
      lowStockProducts,
      totalClients,
      topItems
    ] = await Promise.all([
      prisma.exchangeRate.findFirst({ where: { isActive: true } }),
      prisma.invoice.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: { items: true }
      }),
      prisma.purchase.findMany({
        where: { createdAt: { gte: startDate, lte: endDate } },
        include: { items: true }
      }),
      prisma.debt.findMany({
        where: { status: { in: ['PENDING', 'PARTIAL'] } }
      }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.product.findMany({
        where: { stock: { lte: 5 }, isActive: true },
        take: 5
      }),
      prisma.client.count(),
      prisma.invoiceItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, totalUSD: true },
        where: { invoice: { createdAt: { gte: startDate, lte: endDate } } },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5
      })
    ]);

    const currentRate = activeRate?.rate || 1;

    // Ventas
    const totalSalesUSD = invoices.reduce((acc, inv) => acc + inv.totalUSD, 0);
    const totalSalesVES = invoices.reduce((acc, inv) => acc + inv.totalVES, 0);
    const totalSalesCount = invoices.length;
    const averageTicketUSD = totalSalesCount > 0 ? totalSalesUSD / totalSalesCount : 0;

    // Compras
    const totalPurchasesUSD = purchases.reduce((acc, p) => acc + p.totalUSD, 0);
    const totalPurchasesVES = purchases.reduce((acc, p) => acc + p.totalVES, 0);
    const totalPurchasesCount = purchases.length;

    // Balance
    const netProfitUSD = totalSalesUSD - totalPurchasesUSD;
    const netProfitVES = totalSalesVES - totalPurchasesVES;

    // Deudas
    const totalPendingDebtUSD = allPendingDebts.reduce((acc, d) => acc + d.remainingUSD, 0);
    const totalPendingDebtVES = totalPendingDebtUSD * currentRate;

    // Ventas por método de pago
    const salesByPaymentMethod: Record<string, { count: number; totalUSD: number }> = {};
    invoices.forEach(inv => {
      if (!salesByPaymentMethod[inv.paymentMethod]) {
        salesByPaymentMethod[inv.paymentMethod] = { count: 0, totalUSD: 0 };
      }
      salesByPaymentMethod[inv.paymentMethod].count += 1;
      salesByPaymentMethod[inv.paymentMethod].totalUSD += inv.totalUSD;
    });

    // Ventas por hora del día (0h a 23h)
    const salesByHour = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      label: `${h}:00`,
      count: 0,
      totalUSD: 0
    }));

    invoices.forEach(inv => {
      const h = new Date(inv.createdAt).getHours();
      if (salesByHour[h]) {
        salesByHour[h].count += 1;
        salesByHour[h].totalUSD += inv.totalUSD;
      }
    });

    // Ranking de Deudores Mayores
    const topDebtors = allPendingDebts
      .sort((a, b) => b.remainingUSD - a.remainingUSD)
      .slice(0, 5)
      .map(d => ({
        id: d.id,
        clientId: d.clientId,
        remainingUSD: d.remainingUSD,
        remainingVES: parseFloat((d.remainingUSD * currentRate).toFixed(2))
      }));

    res.json({
      period,
      startDate,
      endDate,
      activeRate: activeRate || { name: 'BCV', rate: 1, symbol: 'VES' },
      sales: {
        count: totalSalesCount,
        totalUSD: parseFloat(totalSalesUSD.toFixed(2)),
        totalVES: parseFloat(totalSalesVES.toFixed(2)),
        averageTicketUSD: parseFloat(averageTicketUSD.toFixed(2)),
        byPaymentMethod: salesByPaymentMethod,
        byHour: salesByHour
      },
      purchases: {
        count: totalPurchasesCount,
        totalUSD: parseFloat(totalPurchasesUSD.toFixed(2)),
        totalVES: parseFloat(totalPurchasesVES.toFixed(2))
      },
      netBalance: {
        profitUSD: parseFloat(netProfitUSD.toFixed(2)),
        profitVES: parseFloat(netProfitVES.toFixed(2)),
        marginPercent: totalSalesUSD > 0 ? parseFloat(((netProfitUSD / totalSalesUSD) * 100).toFixed(1)) : 0
      },
      debts: {
        count: allPendingDebts.length,
        totalUSD: parseFloat(totalPendingDebtUSD.toFixed(2)),
        totalVES: parseFloat(totalPendingDebtVES.toFixed(2)),
        topDebtors
      },
      inventory: {
        totalActiveProducts: totalProducts,
        lowStockCount: lowStockProducts.length,
        lowStockItems: lowStockProducts
      },
      totalClients,
      topProducts: topItems.map(item => ({
        name: item.productName,
        totalQuantity: item._sum.quantity || 0,
        totalUSD: parseFloat((item._sum.totalUSD || 0).toFixed(2))
      }))
    });
  } catch (error) {
    next(error);
  }
};
