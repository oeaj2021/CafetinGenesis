import { Router } from 'express';
import { getDebts, addPaymentToDebt, getDebtPDF, getDebtImage } from '../controllers/debts.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getDebts);
router.get('/:id/pdf', getDebtPDF);
router.get('/:id/image', getDebtImage);
router.post('/:id/payments', addPaymentToDebt);

export default router;
