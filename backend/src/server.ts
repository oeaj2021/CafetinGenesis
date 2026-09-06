import { app } from './app';
import { ENV } from './config/env';
import { bootstrapDatabase } from './services/bootstrap.service';
import { startRateSyncCron } from './services/cron.service';
import { logger } from './utils/logger';

// Captura global de excepciones no controladas
process.on('uncaughtException', (err: Error) => {
  logger.error('FATAL_UNCAUGHT_EXCEPTION', `Excepción fatal no controlada: ${err.message}`, {
    stack: err.stack
  });
});

// Captura global de promesas rechazadas sin catch
process.on('unhandledRejection', (reason: any) => {
  logger.error('FATAL_UNHANDLED_REJECTION', `Promesa rechazada no controlada`, {
    reason: reason instanceof Error ? { message: reason.message, stack: reason.stack } : reason
  });
});

// Señales de terminación de Docker / Dokploy
process.on('SIGTERM', () => {
  logger.info('PROCESS_LIFECYCLE', 'Recibida señal SIGTERM: cerrando servidor de forma ordenada...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('PROCESS_LIFECYCLE', 'Recibida señal SIGINT: cerrando servidor...');
  process.exit(0);
});

// Iniciar servidor HTTP
const server = app.listen(ENV.PORT, '0.0.0.0', async () => {
  logger.success('SERVER_INIT', `Cafetín Génesis Backend iniciado exitosamente en puerto ${ENV.PORT}`, {
    nodeEnv: ENV.NODE_ENV,
    localUrl: `http://localhost:${ENV.PORT}`,
    networkUrl: `http://0.0.0.0:${ENV.PORT}`
  });

  try {
    // Inicializar base de datos y seed de datos esenciales
    await bootstrapDatabase();
    logger.success('BOOTSTRAP', 'Verificación de base de datos completada.');
  } catch (err: any) {
    logger.error('BOOTSTRAP_ERROR', `Error durante el bootstrap de la base de datos: ${err.message}`, {
      stack: err.stack
    });
  }

  // Iniciar cron de sincronización de tasa BCV
  try {
    startRateSyncCron();
    logger.info('CRON_INIT', 'Servicio de sincronización de tasas BCV inicializado.');
  } catch (err: any) {
    logger.error('CRON_ERROR', `Error iniciando el cron de tasas: ${err.message}`);
  }
});

