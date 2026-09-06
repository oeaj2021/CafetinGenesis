import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const invoiceItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().min(1, 'Nombre del producto requerido'),
  quantity: z.number().int().positive('Cantidad debe ser mayor a 0'),
  unitPriceUSD: z.number().nonnegative('Precio USD no puede ser negativo')
});

const paymentBreakdownItemSchema = z.object({
  method: z.string().min(1),
  amountUSD: z.number().nonnegative(),
  amountVES: z.number().nonnegative(),
  reference: z.string().optional().nullable()
});

const createInvoiceSchema = z.object({
  clientId: z.string().optional().nullable(),
  clientName: z.string().min(1, 'Nombre del cliente requerido'),
  clientIdNumber: z.string().min(1, 'Cédula/RIF requerida'),
  clientPhone: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH_USD', 'CASH_VES', 'PAGO_MOVIL', 'CARD', 'ZELLE', 'CREDIT', 'MIXED']),
  amountPaidUSD: z.number().nonnegative().optional().nullable(),
  changeUSD: z.number().nonnegative().optional().nullable(),
  paymentBreakdown: z.array(paymentBreakdownItemSchema).optional().nullable(),
  notes: z.string().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'Debe incluir al menos un producto')
});

export const getInvoices = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, paymentMethod, paymentStatus, from, to } = req.query;
    const where: any = {};

    if (paymentMethod && typeof paymentMethod === 'string') {
      where.paymentMethod = paymentMethod;
    }
    if (paymentStatus && typeof paymentStatus === 'string') {
      where.paymentStatus = paymentStatus;
    }
    if (from || to) {
      where.createdAt = {};
      if (from && typeof from === 'string') where.createdAt.gte = new Date(from);
      if (to && typeof to === 'string') where.createdAt.lte = new Date(to);
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { clientName: { contains: search } },
        { clientIdNumber: { contains: search } }
      ];
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: {
        client: true,
        items: true,
        debt: { include: { payments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ invoices });
  } catch (error) {
    next(error);
  }
};

export const getInvoiceById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        client: true,
        items: true,
        debt: { include: { payments: true } }
      }
    });
    if (!invoice) {
      res.status(404).json({ message: 'Factura no encontrada' });
      return;
    }
    res.json({ invoice });
  } catch (error) {
    next(error);
  }
};

export const createInvoice = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createInvoiceSchema.parse(req.body);

    const activeRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true }
    });
    const rate = activeRate?.rate || 1;

    // Generar correlativo
    const count = await prisma.invoice.count();
    const invoiceNumber = `FAC-${String(count + 1).padStart(5, '0')}`;

    let subtotalUSD = 0;
    const itemsFormatted = data.items.map(item => {
      const totalUSD = item.quantity * item.unitPriceUSD;
      const unitPriceVES = item.unitPriceUSD * rate;
      const totalVES = totalUSD * rate;
      subtotalUSD += totalUSD;
      return {
        productId: item.productId || null,
        productName: item.productName,
        quantity: item.quantity,
        unitPriceUSD: item.unitPriceUSD,
        unitPriceVES: parseFloat(unitPriceVES.toFixed(2)),
        totalUSD: parseFloat(totalUSD.toFixed(2)),
        totalVES: parseFloat(totalVES.toFixed(2))
      };
    });

    const totalUSD = parseFloat(subtotalUSD.toFixed(2));
    const totalVES = parseFloat((totalUSD * rate).toFixed(2));
    const isCredit = data.paymentMethod === 'CREDIT';
    const paymentStatus = isCredit ? 'PENDING' : 'PAID';

    const invoice = await prisma.$transaction(async (tx) => {
      // 1. Descontar stock
      for (const item of data.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } }
          });
        }
      }

      // 2. Gestionar cliente si no existe
      let finalClientId = data.clientId;
      if (!finalClientId && data.clientIdNumber) {
        let client = await tx.client.findUnique({
          where: { idNumber: data.clientIdNumber }
        });
        if (!client) {
          client = await tx.client.create({
            data: {
              name: data.clientName,
              idNumber: data.clientIdNumber,
              phone: data.clientPhone || 'N/A'
            }
          });
        }
        finalClientId = client.id;
      }

      // 3. Crear Factura
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: finalClientId,
          clientName: data.clientName,
          clientIdNumber: data.clientIdNumber,
          clientPhone: data.clientPhone || null,
          subtotalUSD,
          totalUSD,
          exchangeRate: rate,
          totalVES,
          paymentMethod: data.paymentMethod,
          paymentStatus,
          amountPaidUSD: data.amountPaidUSD || totalUSD,
          changeUSD: data.changeUSD || 0,
          paymentBreakdown: data.paymentBreakdown ? JSON.stringify(data.paymentBreakdown) : null,
          notes: data.notes || null,
          items: {
            create: itemsFormatted
          }
        },
        include: { items: true, client: true }
      });

      // 4. Si fue a crédito, registrar en Deudas (Fiado)
      if (isCredit && finalClientId) {
        await tx.debt.create({
          data: {
            clientId: finalClientId,
            invoiceId: createdInvoice.id,
            totalUSD,
            totalVES,
            remainingUSD: totalUSD,
            remainingVES: totalVES,
            status: 'PENDING',
            description: `Factura ${invoiceNumber} a crédito`
          }
        });
      }

      return createdInvoice;
    });

    res.status(201).json({
      message: 'Factura generada exitosamente',
      invoice
    });
  } catch (error) {
    next(error);
  }
};
