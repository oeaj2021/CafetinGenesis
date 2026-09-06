import { app } from './app';
import { ENV } from './config/env';
import { bootstrapDatabase } from './services/bootstrap.service';
import { startRateSyncCron } from './services/cron.service';

// Listen on all network interfaces (0.0.0.0)
app.listen(ENV.PORT, '0.0.0.0', async () => {
  console.log(`🚀 Cafetín Génesis Backend corriendo en:`);
  console.log(`   - Local:   http://localhost:${ENV.PORT}`);
  console.log(`   - Red LAN: http://0.0.0.0:${ENV.PORT}`);

  // Verificar e inicializar registros maestros si la BD está vacía
  await bootstrapDatabase();

  // Iniciar tarea en segundo plano para sincronizar tasa oficial BCV
  startRateSyncCron();
});
