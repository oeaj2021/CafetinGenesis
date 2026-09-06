import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../config/prisma';

const clientSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  idNumber: z.string().min(1, 'La cédula/RIF es obligatoria'),
  phone: z.string().min(1, 'El teléfono es obligatorio'),
  address: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  notes: z.string().optional().nullable()
});

export const getClients = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { search } = req.query;
    const where: any = {};
    if (search && typeof search === 'string') {
      where.OR = [
        { name: { contains: search } },
        { idNumber: { contains: search } },
        { phone: { contains: search } }
      ];
    }
    const clients = await prisma.client.findMany({
      where,
      include: {
        debts: {
          where: { status: { in: ['PENDING', 'PARTIAL'] } }
        },
        _count: { select: { invoices: true, debts: true } }
      },
      orderBy: { name: 'asc' }
    });

    const formatted = clients.map(c => {
      const totalPendingDebtUSD = c.debts.reduce((acc, d) => acc + d.remainingUSD, 0);
      const totalPendingDebtVES = c.debts.reduce((acc, d) => acc + d.remainingVES, 0);
      return {
        ...c,
        totalPendingDebtUSD: parseFloat(totalPendingDebtUSD.toFixed(2)),
        totalPendingDebtVES: parseFloat(totalPendingDebtVES.toFixed(2))
      };
    });

    res.json({ clients: formatted });
  } catch (error) {
    next(error);
  }
};

export const getClientById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
      include: {
        debts: {
          include: { payments: true },
          orderBy: { createdAt: 'desc' }
        },
        invoices: {
          include: { items: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });
    if (!client) {
      res.status(404).json({ message: 'Cliente no encontrado' });
      return;
    }
    res.json({ client });
  } catch (error) {
    next(error);
  }
};

export const createClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = clientSchema.parse(req.body);
    const existing = await prisma.client.findUnique({ where: { idNumber: data.idNumber } });
    if (existing) {
      res.status(400).json({ message: 'Ya existe un cliente con esta Cédula/RIF' });
      return;
    }
    const client = await prisma.client.create({
      data: {
        ...data,
        email: data.email || null
      }
    });
    res.status(201).json({ message: 'Cliente registrado con éxito', client });
  } catch (error) {
    next(error);
  }
};

export const updateClient = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = clientSchema.partial().parse(req.body);
    const client = await prisma.client.update({
      where: { id },
      data: {
        ...data,
        email: data.email === '' ? null : data.email
      }
    });
    res.json({ message: 'Cliente actualizado con éxito', client });
  } catch (error) {
    next(error);
  }
};
