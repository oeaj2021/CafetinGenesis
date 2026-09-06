import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  // Server
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',

  // Database & Auth
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: process.env.JWT_SECRET || 'genesis_dev_secret_jwt_key_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',

  // Initial System Credentials (Configurable via .env)
  INITIAL_ADMIN_EMAIL: process.env.INITIAL_ADMIN_EMAIL || 'admin@genesis.com',
  INITIAL_ADMIN_USERNAME: process.env.INITIAL_ADMIN_USERNAME || 'admin',
  INITIAL_ADMIN_PASSWORD: process.env.INITIAL_ADMIN_PASSWORD || 'admin123',
  INITIAL_ADMIN_NAME: process.env.INITIAL_ADMIN_NAME || 'Administrador Principal',
  INITIAL_CASHIER_EMAIL: process.env.INITIAL_CASHIER_EMAIL || 'cajero@genesis.com',
  INITIAL_CASHIER_USERNAME: process.env.INITIAL_CASHIER_USERNAME || 'cajero',
  INITIAL_CASHIER_PASSWORD: process.env.INITIAL_CASHIER_PASSWORD || 'cajero123',
  INITIAL_CASHIER_NAME: process.env.INITIAL_CASHIER_NAME || 'Cajero / Atención',

  // Rates & Monitor DolarVzla
  DOLARVZLA_API_KEY: process.env.DOLARVZLA_API_KEY || '9e6461acff8c6e405a9db8688426e291cae064f0eb491cb549d1c97239324035',
  DOLARVZLA_BCV_URL: process.env.DOLARVZLA_BCV_URL || 'https://rates.dolarvzla.com/bcv/current.json',
  DOLARVZLA_FALLBACK_URL: process.env.DOLARVZLA_FALLBACK_URL || 'https://api.dolarvzla.com/public/usdt/exchange-rate',
  CRON_SYNC_SCHEDULE: process.env.CRON_SYNC_SCHEDULE || '0 8,13,17 * * 1-5',

  // Business Profile & Pago Móvil Defaults
  BUSINESS_NAME: process.env.BUSINESS_NAME || 'Cafetín Génesis',
  BUSINESS_RIF: process.env.BUSINESS_RIF || 'J-50123456-7',
  BUSINESS_PHONE: process.env.BUSINESS_PHONE || '+58 414-9998877',
  BUSINESS_ADDRESS: process.env.BUSINESS_ADDRESS || 'Av. Principal, Edificio Génesis, PB - Caracas',
  BUSINESS_PAGOMOVIL_BANK: process.env.BUSINESS_PAGOMOVIL_BANK || '0134 - Banesco',
  BUSINESS_PAGOMOVIL_ID: process.env.BUSINESS_PAGOMOVIL_ID || 'J-501234567',
  BUSINESS_PAGOMOVIL_PHONE: process.env.BUSINESS_PAGOMOVIL_PHONE || '04149998877',

  // Integrations & Webhooks (n8n / Evolution API)
  EVOLUTION_API_URL: process.env.EVOLUTION_API_URL || '',
  EVOLUTION_API_KEY: process.env.EVOLUTION_API_KEY || '',
  EVOLUTION_INSTANCE_NAME: process.env.EVOLUTION_INSTANCE_NAME || 'cafetin-genesis',
  N8N_WEBHOOK_DEBT_NOTIFY: process.env.N8N_WEBHOOK_DEBT_NOTIFY || '',
  N8N_WEBHOOK_PAYMENT_NOTIFY: process.env.N8N_WEBHOOK_PAYMENT_NOTIFY || ''
};

