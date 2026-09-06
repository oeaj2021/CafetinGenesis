import https from 'https';
import { prisma } from '../config/prisma';

export interface DolarVzlaBcvResponse {
  current?: {
    date: string;
    usd: number;
    eur: number;
  };
  previous?: {
    date: string;
    usd: number;
    eur: number;
  };
  changePercentage?: {
    usd: number;
    eur: number;
  };
}

const DOLARVZLA_API_KEY = process.env.DOLARVZLA_API_KEY || '9e6461acff8c6e405a9db8688426e291cae064f0eb491cb549d1c97239324035';

function httpsGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

export const fetchDolarVzlaBcv = async (): Promise<DolarVzlaBcvResponse> => {
  try {
    // 1. Intentar endpoint directo de rates.dolarvzla.com
    const rawData = await httpsGet('https://rates.dolarvzla.com/bcv/current.json', {
      'x-dolarvzla-key': DOLARVZLA_API_KEY,
      'User-Agent': 'CafetinGenesis/1.0'
    });
    return JSON.parse(rawData);
  } catch (error: any) {
    console.warn('[DolarVzla Service] Error con rates.dolarvzla.com, intentando fallback...', error.message);
    
    // Fallback: endpoint público API
    const rawData = await httpsGet('https://api.dolarvzla.com/public/usdt/exchange-rate', {
      'x-dolarvzla-key': DOLARVZLA_API_KEY,
      'User-Agent': 'CafetinGenesis/1.0'
    });
    return JSON.parse(rawData);
  }
};

export const syncDolarVzlaRatesInDatabase = async () => {
  const data = await fetchDolarVzlaBcv();
  
  if (!data.current || !data.current.usd) {
    throw new Error('No se pudo obtener el valor del dólar BCV desde la API de DolarVzla');
  }

  const usdBcv = parseFloat(data.current.usd.toFixed(2));
  const eurBcv = data.current.eur ? parseFloat(data.current.eur.toFixed(2)) : null;

  // Actualizar o crear BCV Oficial
  const bcvRate = await prisma.exchangeRate.upsert({
    where: { name: 'BCV Oficial' },
    update: {
      rate: usdBcv,
      symbol: 'VES',
      isActive: true,
      updatedAt: new Date()
    },
    create: {
      name: 'BCV Oficial',
      rate: usdBcv,
      symbol: 'VES',
      isActive: true
    }
  });

  // Asegurar que las demás tasas queden inactivas al activar BCV
  await prisma.exchangeRate.updateMany({
    where: { id: { not: bcvRate.id } },
    data: { isActive: false }
  });

  // Si viene Euro, actualizarlo como referencia secundaria
  if (eurBcv) {
    await prisma.exchangeRate.upsert({
      where: { name: 'Euro BCV' },
      update: {
        rate: eurBcv,
        symbol: 'VES',
        isActive: false,
        updatedAt: new Date()
      },
      create: {
        name: 'Euro BCV',
        rate: eurBcv,
        symbol: 'VES',
        isActive: false
      }
    });
  }

  return {
    rate: bcvRate,
    apiData: data,
    syncedAt: new Date().toISOString()
  };
};
