import { Router } from 'express';
import { login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { loginLimiter } from '../middlewares/rateLimiter.middleware';

const router = Router();
router.post('/login', loginLimiter, login);
router.get('/me', authenticate, getMe);

export default router;
