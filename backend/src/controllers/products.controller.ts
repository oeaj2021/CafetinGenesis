import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { logAudit } from '../services/audit.service';
import { AuthRequest } from '../middlewares/auth.middleware';

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  barcode: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
  costUSD: z.number().nonnegative('El costo debe ser >= 0').default(0),
  priceUSD: z.number().nonnegative('El precio debe ser >= 0'),
  stock: z.number().int().nonnegative('El stock debe ser >= 0'),
  minStock: z.number().int().nonnegative().default(5),
  image: z.string().optional().nullable().or(z.literal('')),
  isActive: z.boolean().default(true)
});

export const getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, search, activeOnly } = req.query;
    const where: any = {};

    if (activeOnly === 'true') {
      where.isActive = true;
    }
    if (category && typeof category === 'string') {
      where.categoryId = category;
    }
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } }
      ];
    }

    const [products, activeRate] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { name: 'asc' }
      }),
      prisma.exchangeRate.findFirst({ where: { isActive: true } })
    ]);

    const rateMultiplier = activeRate?.rate || 1;

    const formatted = products.map(p => ({
      ...p,
      costVES: parseFloat((p.costUSD * rateMultiplier).toFixed(2)),
      priceVES: parseFloat((p.priceUSD * rateMultiplier).toFixed(2)),
      activeRate: rateMultiplier
    }));

    res.json({ products: formatted, activeRate });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: { category: true }
    });
    if (!product) {
      res.status(404).json({ message: 'Producto no encontrado' });
      return;
    }
    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const getProductByBarcode = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findFirst({
      where: { barcode: barcode.trim(), isActive: true },
      include: { category: true }
    });
    if (!product) {
      res.status(404).json({ message: 'Producto con código de barras no encontrado' });
      return;
    }
    res.json({ product });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = productSchema.parse(req.body);
    const product = await prisma.product.create({
      data: {
        ...data,
        image: data.image || null
      },
      include: { category: true }
    });

    logAudit({
      action: 'CREATE',
      module: 'PRODUCTS',
      description: `Creación de producto: "${product.name}" ($${product.priceUSD.toFixed(2)})`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name,
      userRole: req.user?.role,
      ipAddress: req.ip,
      newValues: { id: product.id, name: product.name, priceUSD: product.priceUSD, stock: product.stock }
    });

    res.status(201).json({ message: 'Producto registrado con éxito', product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const oldProduct = await prisma.product.findUnique({ where: { id } });
    const data = productSchema.partial().parse(req.body);
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...data,
        image: data.image === '' ? null : data.image
      },
      include: { category: true }
    });

    logAudit({
      action: 'UPDATE',
      module: 'PRODUCTS',
      description: `Actualización de producto: "${product.name}"`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name,
      userRole: req.user?.role,
      ipAddress: req.ip,
      oldValues: oldProduct ? { name: oldProduct.name, priceUSD: oldProduct.priceUSD, stock: oldProduct.stock, costUSD: oldProduct.costUSD } : null,
      newValues: { name: product.name, priceUSD: product.priceUSD, stock: product.stock, costUSD: product.costUSD }
    });

    res.json({ message: 'Producto actualizado con éxito', product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const productToDelete = await prisma.product.findUnique({ where: { id } });
    await prisma.product.delete({ where: { id } });

    logAudit({
      action: 'DELETE',
      module: 'PRODUCTS',
      description: `Eliminación de producto: "${productToDelete?.name || id}"`,
      userId: req.user?.id,
      userName: req.user?.username || req.user?.name,
      userRole: req.user?.role,
      ipAddress: req.ip,
      oldValues: productToDelete
    });

    res.json({ message: 'Producto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
