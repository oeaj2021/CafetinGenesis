import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany();
    const configMap: Record<string, string> = {
      BUSINESS_NAME: 'Cafetín Génesis',
      BUSINESS_RIF: 'J-12345678-9',
      BUSINESS_PHONE: '584120000000',
      BUSINESS_ADDRESS: 'Plaza Bolívar, Local 4, Venezuela',
      BUSINESS_FOOTER_NOTE: '¡Gracias por su compra!'
    };
    settings.forEach(s => { configMap[s.key] = s.value; });
    res.json({ settings: configMap });
  } catch (error) {
    next(error);
  }
};

export const updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body as Record<string, string>;
    for (const [key, value] of Object.entries(updates)) {
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) }
      });
    }
    res.json({ message: 'Configuraciones guardadas correctamente' });
  } catch (error) {
    next(error);
  }
};
