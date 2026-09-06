import rateLimit from 'express-rate-limit';

// Limitador global para prevenir ataques DoS
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // Máximo 1000 peticiones por ventana por IP
  standardHeaders: true, // Retorna RateLimit headers estándar
  legacyHeaders: false,
  message: {
    message: 'Demasiadas peticiones desde esta IP. Por favor intente más tarde.'
  }
});

// Limitador estricto para inicio de sesión (Prevención de Brute-Force & Credential Stuffing)
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 intentos por ventana por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    message: 'Demasiados intentos de inicio de sesión. Por seguridad, su IP ha sido bloqueada temporalmente (15 min).'
  }
});
