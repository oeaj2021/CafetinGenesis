import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env';

export const bootstrapDatabase = async (): Promise<void> => {
  try {
    // 1. Verificar si existen usuarios
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🔄 [Bootstrap] Inicializando usuarios maestros desde variables de entorno...');
      const adminPassword = await bcrypt.hash(ENV.INITIAL_ADMIN_PASSWORD, 10);
      const cajeroPassword = await bcrypt.hash(ENV.INITIAL_CASHIER_PASSWORD, 10);

      await prisma.user.create({
        data: {
          email: ENV.INITIAL_ADMIN_EMAIL,
          username: ENV.INITIAL_ADMIN_USERNAME,
          name: ENV.INITIAL_ADMIN_NAME,
          password: adminPassword,
          role: 'ADMIN'
        }
      });

      await prisma.user.create({
        data: {
          email: ENV.INITIAL_CASHIER_EMAIL,
          username: ENV.INITIAL_CASHIER_USERNAME,
          name: ENV.INITIAL_CASHIER_NAME,
          password: cajeroPassword,
          role: 'OPERATOR'
        }
      });
      console.log(`✅ [Bootstrap] Usuarios creados: ${ENV.INITIAL_ADMIN_EMAIL} / ${ENV.INITIAL_CASHIER_EMAIL}`);
    }

    // 2. Verificar tasa de cambio activa
    const rateCount = await prisma.exchangeRate.count();
    if (rateCount === 0) {
      console.log('🔄 [Bootstrap] Inicializando tasa de cambio oficial...');
      await prisma.exchangeRate.create({
        data: {
          name: 'BCV Oficial',
          rate: 65.50,
          symbol: 'VES',
          isActive: true
        }
      });
      console.log('✅ [Bootstrap] Tasa BCV inicial creada (65.50 Bs)');
    }

    // 3. Verificar configuraciones del negocio
    const settingCount = await prisma.setting.count();
    if (settingCount === 0) {
      console.log('🔄 [Bootstrap] Configurando datos iniciales de empresa...');
      const settings = [
        { key: 'BUSINESS_NAME', value: 'Cafetín Génesis' },
        { key: 'BUSINESS_RIF', value: 'J-40987654-3' },
        { key: 'BUSINESS_PHONE', value: '584120000000' },
        { key: 'BUSINESS_ADDRESS', value: 'Av. Bolívar, Centro Comercial Plaza, Nivel PB, Local 12' },
        { key: 'BUSINESS_FOOTER_NOTE', value: '¡Gracias por preferir Cafetín Génesis! Síguenos en @cafetingenesis' }
      ];
      for (const s of settings) {
        await prisma.setting.create({ data: s });
      }
      console.log('✅ [Bootstrap] Configuraciones iniciales guardadas');
    }
  } catch (error) {
    console.error('⚠️ [Bootstrap Error] Fallo al verificar/inicializar registros base:', error);
  }
};
