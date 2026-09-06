import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

export const getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const settings = await prisma.setting.findMany();
    const configMap: Record<string, string> = {
      BUSINESS_NAME: 'Cafetín Génesis',
      BUSINESS_RIF: 'J-12345678-9',
      BUSINESS_PHONE: '584120000000',
      BUSINESS_PHONE_2: '',
      BUSINESS_EMAIL: 'contacto@cafetingenesis.com',
      BUSINESS_ADDRESS: 'Plaza Bolívar, Local 4, Venezuela',
      BUSINESS_MAPS_COORDS: '10.4806, -66.9036',
      BUSINESS_MAPS_URL: '',
      BUSINESS_SCHEDULE: 'Lunes a Sábado: 7:00 AM - 8:00 PM | Domingos: 8:00 AM - 4:00 PM',
      BUSINESS_INSTAGRAM: '',
      BUSINESS_ABOUT: 'Somos una empresa comercial dedicada a ofrecer la mejor variedad en bolsos y accesorios, medicamentos esenciales, víveres, desayunos, cafés y platos preparados con la más alta calidad y calidez de servicio.',
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
