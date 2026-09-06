import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const purchaseItemSchema = z.object({
  productId: z.string().optional().nullable(),
  productName: z.string().min(1, 'Nombre del producto requerido'),
  quantity: z.number().int().positive('Cantidad debe ser mayor a 0'),
  unitCostUSD: z.number().nonnegative('Costo USD no puede ser negativo')
});

const createPurchaseSchema = z.object({
  supplierName: z.string().min(1, 'Nombre del proveedor requerido'),
  supplierRif: z.string().optional().nullable(),
  paymentMethod: z.enum(['CASH_USD', 'CASH_VES', 'PAGO_MOVIL', 'CARD', 'ZELLE', 'CREDIT']),
  notes: z.string().optional().nullable(),
  items: z.array(purchaseItemSchema).min(1, 'Debe incluir al menos un producto')
});

export const getPurchases = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search, from, to } = req.query;
    const where: any = {};

    if (from || to) {
      where.createdAt = {};
      if (from && typeof from === 'string') where.createdAt.gte = new Date(from);
      if (to && typeof to === 'string') where.createdAt.lte = new Date(to);
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { purchaseNumber: { contains: search } },
        { supplierName: { contains: search } },
        { supplierRif: { contains: search } }
      ];
    }

    const purchases = await prisma.purchase.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ purchases });
  } catch (error) {
    next(error);
  }
};

export const createPurchase = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createPurchaseSchema.parse(req.body);

    const activeRate = await prisma.exchangeRate.findFirst({
      where: { isActive: true }
    });
    const rate = activeRate?.rate || 1;

    const count = await prisma.purchase.count();
    const purchaseNumber = `COM-${String(count + 1).padStart(5, '0')}`;

    let subtotalUSD = 0;
    const itemsFormatted = data.items.map(item => {
      const totalUSD = item.quantity * item.unitCostUSD;
      const unitCostVES = item.unitCostUSD * rate;
      const totalVES = totalUSD * rate;
      subtotalUSD += totalUSD;
      return {
        productId: item.productId || null,
        productName: item.productName,
        quantity: item.quantity,
        unitCostUSD: item.unitCostUSD,
        unitCostVES: parseFloat(unitCostVES.toFixed(2)),
        totalUSD: parseFloat(totalUSD.toFixed(2)),
        totalVES: parseFloat(totalVES.toFixed(2))
      };
    });

    const totalUSD = parseFloat(subtotalUSD.toFixed(2));
    const totalVES = parseFloat((totalUSD * rate).toFixed(2));

    const purchase = await prisma.$transaction(async (tx) => {
      // Incrementar stock y actualizar costo de compra para los productos
      for (const item of data.items) {
        if (item.productId) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.quantity },
              costUSD: item.unitCostUSD
            }
          });
        }
      }

      return tx.purchase.create({
        data: {
          purchaseNumber,
          supplierName: data.supplierName,
          supplierRif: data.supplierRif || null,
          totalUSD,
          exchangeRate: rate,
          totalVES,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          items: {
            create: itemsFormatted
          }
        },
        include: { items: true }
      });
    });

    res.status(201).json({
      message: 'Compra registrada con éxito e inventario actualizado',
      purchase
    });
  } catch (error) {
    next(error);
  }
};
