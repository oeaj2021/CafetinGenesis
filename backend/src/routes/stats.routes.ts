import { Router } from 'express';
import { getDashboardStats } from '../controllers/stats.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.get('/dashboard', authenticate, getDashboardStats);

export default router;
