import { Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const openShiftSchema = z.object({
  initialCashUSD: z.number().nonnegative('El monto base inicial en USD debe ser >= 0').default(0),
  initialCashVES: z.number().nonnegative('El monto base inicial en Bs debe ser >= 0').default(0),
  notes: z.string().optional().nullable()
});

const closeShiftSchema = z.object({
  closedCashUSD: z.number().nonnegative('El conteo físico de USD debe ser >= 0'),
  closedCashVES: z.number().nonnegative('El conteo físico de Bs debe ser >= 0'),
  notes: z.string().optional().nullable()
});

export const getCurrentShift = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shift = await prisma.cashShift.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' }
    });

    if (!shift) {
      res.json({ shift: null, message: 'No hay ninguna caja o turno abierto actualmente.' });
      return;
    }

    // Calcular ventas acumuladas durante este turno
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: shift.openedAt },
        paymentStatus: 'PAID'
      }
    });

    let totalCashUSD = 0;
    let totalCashVES = 0;
    let totalPagoMovilVES = 0;
    let totalCardVES = 0;
    let totalZelleUSD = 0;
    let totalSalesUSD = 0;
    let totalSalesVES = 0;

    for (const inv of invoices) {
      totalSalesUSD += inv.totalUSD;
      totalSalesVES += inv.totalVES;

      if (inv.paymentBreakdown) {
        try {
          const breakdown = JSON.parse(inv.paymentBreakdown);
          for (const b of breakdown) {
            if (b.method === 'CASH_USD') totalCashUSD += b.amountUSD;
            else if (b.method === 'CASH_VES') totalCashVES += b.amountVES;
            else if (b.method === 'PAGO_MOVIL') totalPagoMovilVES += b.amountVES;
            else if (b.method === 'CARD') totalCardVES += b.amountVES;
            else if (b.method === 'ZELLE') totalZelleUSD += b.amountUSD;
          }
        } catch (e) {
          // fallback
        }
      } else {
        if (inv.paymentMethod === 'CASH_USD') totalCashUSD += inv.totalUSD;
        else if (inv.paymentMethod === 'CASH_VES') totalCashVES += inv.totalVES;
        else if (inv.paymentMethod === 'PAGO_MOVIL') totalPagoMovilVES += inv.totalVES;
        else if (inv.paymentMethod === 'CARD') totalCardVES += inv.totalVES;
        else if (inv.paymentMethod === 'ZELLE') totalZelleUSD += inv.totalUSD;
      }
    }

    // Efectivo teórico en gaveta
    const expectedCashUSD = parseFloat((shift.initialCashUSD + totalCashUSD).toFixed(2));
    const expectedCashVES = parseFloat((shift.initialCashVES + totalCashVES).toFixed(2));

    res.json({
      shift,
      metrics: {
        invoiceCount: invoices.length,
        totalSalesUSD: parseFloat(totalSalesUSD.toFixed(2)),
        totalSalesVES: parseFloat(totalSalesVES.toFixed(2)),
        totalCashUSD: parseFloat(totalCashUSD.toFixed(2)),
        totalCashVES: parseFloat(totalCashVES.toFixed(2)),
        totalPagoMovilVES: parseFloat(totalPagoMovilVES.toFixed(2)),
        totalCardVES: parseFloat(totalCardVES.toFixed(2)),
        totalZelleUSD: parseFloat(totalZelleUSD.toFixed(2)),
        expectedCashUSD,
        expectedCashVES
      }
    });
  } catch (error) {
    next(error);
  }
};

export const openShift = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await prisma.cashShift.findFirst({
      where: { status: 'OPEN' }
    });

    if (existing) {
      res.status(400).json({ message: 'Ya existe un turno de caja abierto. Ciérralo antes de abrir uno nuevo.' });
      return;
    }

    const data = openShiftSchema.parse(req.body);
    const cashierId = req.user?.id || 'unknown';
    const cashierName = req.user?.username || 'Cajero';

    const shift = await prisma.cashShift.create({
      data: {
        cashierId,
        cashierName,
        initialCashUSD: data.initialCashUSD,
        initialCashVES: data.initialCashVES,
        status: 'OPEN',
        notes: data.notes || null
      }
    });

    res.status(201).json({
      message: 'Turno de caja abierto exitosamente',
      shift
    });
  } catch (error) {
    next(error);
  }
};

export const closeShift = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shift = await prisma.cashShift.findFirst({
      where: { status: 'OPEN' },
      orderBy: { openedAt: 'desc' }
    });

    if (!shift) {
      res.status(400).json({ message: 'No hay ningún turno de caja abierto para cerrar.' });
      return;
    }

    const data = closeShiftSchema.parse(req.body);

    // Calcular ventas acumuladas durante este turno
    const invoices = await prisma.invoice.findMany({
      where: {
        createdAt: { gte: shift.openedAt },
        paymentStatus: 'PAID'
      }
    });

    let totalCashUSD = 0;
    let totalCashVES = 0;
    let totalSalesUSD = 0;
    let totalSalesVES = 0;

    for (const inv of invoices) {
      totalSalesUSD += inv.totalUSD;
      totalSalesVES += inv.totalVES;

      if (inv.paymentBreakdown) {
        try {
          const breakdown = JSON.parse(inv.paymentBreakdown);
          for (const b of breakdown) {
            if (b.method === 'CASH_USD') totalCashUSD += b.amountUSD;
            else if (b.method === 'CASH_VES') totalCashVES += b.amountVES;
          }
        } catch (e) {
          // fallback
        }
      } else {
        if (inv.paymentMethod === 'CASH_USD') totalCashUSD += inv.totalUSD;
        else if (inv.paymentMethod === 'CASH_VES') totalCashVES += inv.totalVES;
      }
    }

    const expectedCashUSD = parseFloat((shift.initialCashUSD + totalCashUSD).toFixed(2));
    const expectedCashVES = parseFloat((shift.initialCashVES + totalCashVES).toFixed(2));
    const differenceUSD = parseFloat((data.closedCashUSD - expectedCashUSD).toFixed(2));
    const differenceVES = parseFloat((data.closedCashVES - expectedCashVES).toFixed(2));

    const closedShift = await prisma.cashShift.update({
      where: { id: shift.id },
      data: {
        status: 'CLOSED',
        closedCashUSD: data.closedCashUSD,
        closedCashVES: data.closedCashVES,
        expectedCashUSD,
        expectedCashVES,
        differenceUSD,
        differenceVES,
        totalSalesUSD: parseFloat(totalSalesUSD.toFixed(2)),
        totalSalesVES: parseFloat(totalSalesVES.toFixed(2)),
        notes: data.notes || shift.notes,
        closedAt: new Date()
      }
    });

    res.json({
      message: 'Cierre de caja y arqueo completado exitosamente',
      shift: closedShift,
      audit: {
        expectedCashUSD,
        expectedCashVES,
        differenceUSD,
        differenceVES,
        totalInvoices: invoices.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getShiftHistory = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const shifts = await prisma.cashShift.findMany({
      orderBy: { openedAt: 'desc' },
      take: 50
    });
    res.json({ shifts });
  } catch (error) {
    next(error);
  }
};
