type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS' | 'DEBUG';

function formatLog(level: LogLevel, tag: string, message: string, meta?: any): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? `\n${typeof meta === 'object' ? JSON.stringify(meta, null, 2) : meta}` : '';

  switch (level) {
    case 'INFO':
      return `ℹ️ [INFO]    [${timestamp}] [${tag}] ${message}${metaStr}`;
    case 'SUCCESS':
      return `✅ [SUCCESS] [${timestamp}] [${tag}] ${message}${metaStr}`;
    case 'WARN':
      return `⚠️ [WARN]    [${timestamp}] [${tag}] ${message}${metaStr}`;
    case 'ERROR':
      return `🚨 [ERROR]   [${timestamp}] [${tag}] ${message}${metaStr}`;
    case 'DEBUG':
      return `🔍 [DEBUG]   [${timestamp}] [${tag}] ${message}${metaStr}`;
    default:
      return `[${timestamp}] [${tag}] ${message}${metaStr}`;
  }
}

export const logger = {
  info: (tag: string, message: string, meta?: any) => {
    console.log(formatLog('INFO', tag, message, meta));
  },
  success: (tag: string, message: string, meta?: any) => {
    console.log(formatLog('SUCCESS', tag, message, meta));
  },
  warn: (tag: string, message: string, meta?: any) => {
    console.warn(formatLog('WARN', tag, message, meta));
  },
  error: (tag: string, message: string, meta?: any) => {
    console.error(formatLog('ERROR', tag, message, meta));
  },
  debug: (tag: string, message: string, meta?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(formatLog('DEBUG', tag, message, meta));
    }
  },
  http: (method: string, path: string, status: number, durationMs: number, ip?: string) => {
    const icon = status >= 500 ? '🚨' : status >= 400 ? '⚠️' : '⚡';
    const timestamp = new Date().toISOString();
    console.log(`${icon} [HTTP] [${timestamp}] ${method} ${path} -> Status: ${status} (${durationMs}ms) [IP: ${ip || 'unknown'}]`);
  }
};
