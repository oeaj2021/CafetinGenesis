import { Router } from 'express';
import authRoutes from './auth.routes';
import ratesRoutes from './rates.routes';
import productsRoutes from './products.routes';
import categoriesRoutes from './categories.routes';
import clientsRoutes from './clients.routes';
import invoicesRoutes from './invoices.routes';
import purchasesRoutes from './purchases.routes';
import debtsRoutes from './debts.routes';
import settingsRoutes from './settings.routes';
import statsRoutes from './stats.routes';
import cashShiftRoutes from './cashShift.routes';
import mobileRoutes from './mobile.routes';
import dailyMenuRoutes from './dailyMenu.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/rates', ratesRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/clients', clientsRoutes);
router.use('/invoices', invoicesRoutes);
router.use('/purchases', purchasesRoutes);
router.use('/debts', debtsRoutes);
router.use('/settings', settingsRoutes);
router.use('/stats', statsRoutes);
router.use('/cash-shifts', cashShiftRoutes);
router.use('/mobile', mobileRoutes);
router.use('/daily-menu', dailyMenuRoutes);

export default router;
