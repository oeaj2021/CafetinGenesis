import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { AuthRequest } from '../middlewares/auth.middleware';

const createUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Correo electrónico no válido'),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  role: z.enum(['ADMIN', 'OPERATOR', 'CASHIER', 'KITCHEN']).default('OPERATOR')
});

const updateUserSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
  email: z.string().email('Correo electrónico no válido').optional(),
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres').optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  role: z.enum(['ADMIN', 'OPERATOR', 'CASHIER', 'KITCHEN']).optional()
});

export const getUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ users });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
};

export const createUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = createUserSchema.parse(req.body);

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email.toLowerCase().trim() },
          { username: data.username.toLowerCase().trim() }
        ]
      }
    });

    if (existing) {
      res.status(400).json({ message: 'El correo electrónico o nombre de usuario ya está registrado' });
      return;
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        username: data.username.toLowerCase().trim(),
        password: hashedPassword,
        role: data.role
      },
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true
      }
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', user });
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({ where: { id } });
    if (!existingUser) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    if (data.email || data.username) {
      const duplicate = await prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                ...(data.email ? [{ email: data.email.toLowerCase().trim() }] : []),
                ...(data.username ? [{ username: data.username.toLowerCase().trim() }] : [])
              ]
            }
          ]
        }
      });
      if (duplicate) {
        res.status(400).json({ message: 'El correo o nombre de usuario ya está en uso por otro operador' });
        return;
      }
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.email) updateData.email = data.email.toLowerCase().trim();
    if (data.username) updateData.username = data.username.toLowerCase().trim();
    if (data.role) updateData.role = data.role;
    if (data.password && data.password.trim().length >= 6) {
      updateData.password = await bcrypt.hash(data.password.trim(), 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json({ message: 'Usuario actualizado con éxito', user });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (req.user?.id === id) {
      res.status(400).json({ message: 'No puedes eliminar tu propia cuenta de usuario en sesión' });
      return;
    }

    const userToDelete = await prisma.user.findUnique({ where: { id } });
    if (!userToDelete) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    if (userToDelete.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        res.status(400).json({ message: 'No se puede eliminar el único Administrador del sistema' });
        return;
      }
    }

    await prisma.user.delete({ where: { id } });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};
