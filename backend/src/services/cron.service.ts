import { syncDolarVzlaRatesInDatabase } from './dolarVzla.service';

let syncInterval: NodeJS.Timeout | null = null;

export const startRateSyncCron = () => {
  // Ejecutar primera sincronización 10 segundos después del arranque
  setTimeout(async () => {
    try {
      console.log('⏰ [Cron BCV] Ejecutando sincronización inicial de tasa DolarVzla...');
      const result = await syncDolarVzlaRatesInDatabase();
      console.log(`✅ [Cron BCV] Tasa BCV actualizada a ${result.rate.rate} Bs`);
    } catch (error: any) {
      console.warn('⚠️ [Cron BCV] No se pudo sincronizar tasa automáticamente (se mantiene tasa local):', error.message);
    }
  }, 10000);

  // Ejecutar periódicamente cada 2 horas (7200000 ms)
  syncInterval = setInterval(async () => {
    try {
      console.log('⏰ [Cron BCV] Sincronizando tasa oficial DolarVzla...');
      const result = await syncDolarVzlaRatesInDatabase();
      console.log(`✅ [Cron BCV] Tasa BCV actualizada: ${result.rate.rate} Bs`);
    } catch (error: any) {
      console.warn('⚠️ [Cron BCV] Error en sincronización periódica de tasa:', error.message);
    }
  }, 2 * 60 * 60 * 1000);
};

export const stopRateSyncCron = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
  }
};
