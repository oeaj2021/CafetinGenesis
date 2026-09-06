import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma';

const DEFAULT_DAILY_MENU = {
  title: 'Menú Ejecutivo del Día',
  date: new Date().toISOString().split('T')[0],
  subtitle: 'Comida casera, fresca y caliente preparada al momento',
  chefNote: 'Incluye sopa del día y bebida natural refrescante',
  isActive: true,
  basePriceUSD: 5.0,
  soupOrStarter: 'Sopa de Res con Verduras Criollas',
  mainDishes: [
    { id: '1', name: 'Pabellón Criollo Tradicional', description: 'Carne mechada sazonada, caraotas negras con queso, arroz y tajadas', priceUSD: 5.5, available: true },
    { id: '2', name: 'Pollo a la Plancha al Romero', description: 'Pechuga jugosa marinada con hierbas finas', priceUSD: 5.0, available: true },
    { id: '3', name: 'Pescado Frito / Rueda de Pargo', description: 'Pescado fresco del día crujiente y dorado', priceUSD: 6.5, available: true },
    { id: '4', name: 'Chuleta Ahumada Glaseada', description: 'Chuleta glaseada con piña y especias', priceUSD: 5.5, available: true }
  ],
  sideDishes: ['Arroz Blanco', 'Puré de Papas', 'Ensalada Rallada Criolla', 'Tajadas de Plátano Maduro', 'Papas Fritas', 'Tostones con Ajo'],
  drinks: ['Papelón con Limón Frío', 'Jugo Natural de Maracuyá', 'Té Frío de Durazno', 'Agua Mineral'],
  desserts: ['Quesillo Tradicional Casero', 'Torta Tres Leches'],
  includesSoup: true,
  includesDrink: true,
  deliveryAvailable: true
};

export const getDailyMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const setting = await prisma.setting.findUnique({ where: { key: 'DAILY_MENU_DATA' } });
    if (!setting || !setting.value) {
      res.json({ menu: DEFAULT_DAILY_MENU });
      return;
    }
    try {
      const parsed = JSON.parse(setting.value);
      res.json({ menu: parsed });
    } catch {
      res.json({ menu: DEFAULT_DAILY_MENU });
    }
  } catch (error) {
    next(error);
  }
};

export const saveDailyMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const menuData = req.body;
    await prisma.setting.upsert({
      where: { key: 'DAILY_MENU_DATA' },
      update: { value: JSON.stringify(menuData) },
      create: { key: 'DAILY_MENU_DATA', value: JSON.stringify(menuData) }
    });
    res.json({ message: 'Menú del día actualizado con éxito', menu: menuData });
  } catch (error) {
    next(error);
  }
};

export const orderDailyMenu = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      clientName = 'Cliente Menú Diario',
      clientIdNumber = 'V-00000000',
      clientPhone,
      mainDishName,
      mainDishPriceUSD = 5.0,
      quantity = 1,
      sides = [],
      drink = '',
      dessert = '',
      notes = '',
      orderType = 'AQUÍ',
      paymentMethod = 'CASH_USD'
    } = req.body;

    if (!mainDishName) {
      res.status(400).json({ message: 'Debe seleccionar un plato principal' });
      return;
    }

    const activeRate = await prisma.exchangeRate.findFirst({ where: { isActive: true } });
    const rate = activeRate?.rate || 1;
    const count = await prisma.invoice.count();
    const invoiceNumber = 'MEN-' + String(count + 1).padStart(5, '0');

    const unitPriceUSD = Number(mainDishPriceUSD);
    const totalUSD = parseFloat((unitPriceUSD * Number(quantity)).toFixed(2));
    const totalVES = parseFloat((totalUSD * rate).toFixed(2));
    const unitPriceVES = parseFloat((unitPriceUSD * rate).toFixed(2));

    const sidesText = sides.length > 0 ? 'Contornos: ' + sides.join(', ') : '';
    const drinkText = drink ? 'Bebida: ' + drink : '';
    const dessertText = dessert ? 'Postre: ' + dessert : '';
    const extraNotes = notes ? 'Obs: ' + notes : '';

    const fullComandaDetail = [
      '[MENÚ DEL DÍA - PRODUCCIÓN]',
      '[MODALIDAD: ' + orderType + ']',
      'Plato: ' + mainDishName,
      sidesText,
      drinkText,
      dessertText,
      extraNotes
    ].filter(Boolean).join(' | ');

    const invoice = await prisma.$transaction(async (tx) => {
      let finalClientId = null;
      if (clientIdNumber) {
        let client = await tx.client.findUnique({ where: { idNumber: clientIdNumber } });
        if (!client) {
          client = await tx.client.create({
            data: {
              name: clientName,
              idNumber: clientIdNumber,
              phone: clientPhone || 'N/A'
            }
          });
        }
        finalClientId = client.id;
      }

      return await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: finalClientId,
          clientName,
          clientIdNumber,
          clientPhone: clientPhone || null,
          subtotalUSD: totalUSD,
          totalUSD,
          exchangeRate: rate,
          totalVES,
          paymentMethod,
          paymentStatus: paymentMethod === 'CREDIT' ? 'PENDING' : 'PAID',
          amountPaidUSD: totalUSD,
          changeUSD: 0,
          notes: fullComandaDetail,
          items: {
            create: [
              {
                productName: 'Menú del Día: ' + mainDishName,
                quantity: Number(quantity),
                unitPriceUSD,
                unitPriceVES,
                totalUSD,
                totalVES
              }
            ]
          }
        },
        include: { items: true, client: true }
      });
    });

    res.status(201).json({
      message: 'Pedido de Menú Diario enviado a producción de cocina con éxito',
      invoice
    });
  } catch (error) {
    next(error);
  }
};