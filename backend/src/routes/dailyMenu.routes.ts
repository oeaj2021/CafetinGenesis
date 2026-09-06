import { Router } from 'express';
import { getDailyMenu, saveDailyMenu, orderDailyMenu } from '../controllers/dailyMenu.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Publicly readable for customer portal & WhatsApp orders
router.get('/', getDailyMenu);
router.post('/order', orderDailyMenu);

// Protected admin configuration
router.post('/', authenticate, saveDailyMenu);

export default router;