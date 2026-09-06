import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { generateDebtStatementPDF } from '../services/pdf.service';
import { generateDebtStatementImage } from '../services/image.service';

const debtPaymentSchema = z.object({
  amountUSD: z.number().positive('El monto a abonar debe ser mayor a 0'),
  paymentMethod: z.enum(['CASH_USD', 'CASH_VES', 'PAGO_MOVIL', 'CARD', 'ZELLE']),
  reference: z.string().optional().nullable(),
  note: z.string().optional().nullable()
});

export const getDebts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, clientId, search } = req.query;
    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }
    if (clientId && typeof clientId === 'string') {
      where.clientId = clientId;
    }
    if (search && typeof search === 'string') {
      where.client = {
        OR: [
          { name: { contains: search } },
          { idNumber: { contains: search } },
          { phone: { contains: search } }
        ]
      };
    }

    const debts = await prisma.debt.findMany({
      where,
      include: {
        client: true,
        invoice: true,
        payments: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const activeRate = await prisma.exchangeRate.findFirst({ where: { isActive: true } });
    const currentRate = activeRate?.rate || 1;

    const formatted = debts.map(d => ({
      ...d,
      currentRemainingVES: parseFloat((d.remainingUSD * currentRate).toFixed(2)),
      currentRate
    }));

    res.json({ debts: formatted });
  } catch (error) {
    next(error);
  }
};

export const addPaymentToDebt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = debtPaymentSchema.parse(req.body);

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: { invoice: true }
    });

    if (!debt) {
      res.status(404).json({ message: 'Registro de deuda no encontrado' });
      return;
    }

    if (debt.status === 'PAID' || debt.remainingUSD <= 0) {
      res.status(400).json({ message: 'Esta deuda ya está totalmente pagada' });
      return;
    }

    const activeRate = await prisma.exchangeRate.findFirst({ where: { isActive: true } });
    const rate = activeRate?.rate || 1;

    const amountUSD = Math.min(data.amountUSD, debt.remainingUSD);
    const amountVES = parseFloat((amountUSD * rate).toFixed(2));
    const newRemainingUSD = parseFloat((debt.remainingUSD - amountUSD).toFixed(2));
    const newRemainingVES = parseFloat((newRemainingUSD * rate).toFixed(2));
    const newStatus = newRemainingUSD <= 0 ? 'PAID' : 'PARTIAL';

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.debtPayment.create({
        data: {
          debtId: id,
          amountUSD,
          amountVES,
          exchangeRate: rate,
          paymentMethod: data.paymentMethod,
          reference: data.reference || null,
          note: data.note || null
        }
      });

      const updatedDebt = await tx.debt.update({
        where: { id },
        data: {
          remainingUSD: newRemainingUSD,
          remainingVES: newRemainingVES,
          status: newStatus
        },
        include: { payments: true, client: true }
      });

      if (debt.invoiceId) {
        await tx.invoice.update({
          where: { id: debt.invoiceId },
          data: { paymentStatus: newStatus === 'PAID' ? 'PAID' : 'PARTIAL' }
        });
      }

      return { payment, debt: updatedDebt };
    });

    res.status(201).json({
      message: newStatus === 'PAID' ? '¡Deuda saldada por completo!' : 'Abono registrado con éxito',
      ...result
    });
  } catch (error) {
    next(error);
  }
};

export const getDebtPDF = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        client: true,
        invoice: true,
        payments: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!debt) {
      res.status(404).json({ message: 'Registro de deuda no encontrado' });
      return;
    }

    const activeRate = await prisma.exchangeRate.findFirst({ where: { isActive: true } });
    const currentRate = activeRate?.rate || 1;

    const isPaid = debt.status === 'PAID' || debt.remainingUSD <= 0;
    const docType = isPaid ? 'Finiquito_Solvente' : 'Estado_Cuenta';
    const clientName = (debt.client?.name || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${docType}_${clientName}_${debt.invoice?.invoiceNumber || debt.id.slice(0, 6)}.pdf`;

    const pdfBuffer = await generateDebtStatementPDF(debt, currentRate);

    if (format === 'base64' || format === 'json') {
      res.json({
        filename,
        contentType: 'application/pdf',
        isPaid,
        base64: pdfBuffer.toString('base64'),
        remainingUSD: debt.remainingUSD,
        remainingVES: parseFloat((debt.remainingUSD * currentRate).toFixed(2)),
        clientName: debt.client?.name || 'Cliente',
        clientPhone: debt.client?.phone || null
      });
      return;
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.send(pdfBuffer);
  } catch (error) {
    next(error);
  }
};

export const getDebtImage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { format } = req.query;

    const debt = await prisma.debt.findUnique({
      where: { id },
      include: {
        client: true,
        invoice: true,
        payments: { orderBy: { createdAt: 'asc' } }
      }
    });

    if (!debt) {
      res.status(404).json({ message: 'Registro de deuda no encontrado' });
      return;
    }

    const activeRate = await prisma.exchangeRate.findFirst({ where: { isActive: true } });
    const currentRate = activeRate?.rate || 1;

    const isPaid = debt.status === 'PAID' || debt.remainingUSD <= 0;
    const docType = isPaid ? 'Finiquito_Solvente' : 'Estado_Cuenta';
    const clientName = (debt.client?.name || 'Cliente').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${docType}_${clientName}_${debt.invoice?.invoiceNumber || debt.id.slice(0, 6)}.png`;

    const imageBuffer = await generateDebtStatementImage(debt, currentRate);

    if (format === 'base64' || format === 'json') {
      res.json({
        filename,
        contentType: 'image/png',
        isPaid,
        base64: imageBuffer.toString('base64'),
        remainingUSD: debt.remainingUSD,
        remainingVES: parseFloat((debt.remainingUSD * currentRate).toFixed(2)),
        clientName: debt.client?.name || 'Cliente',
        clientPhone: debt.client?.phone || null
      });
      return;
    }

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);
  } catch (error) {
    next(error);
  }
};
