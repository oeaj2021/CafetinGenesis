import { Router } from 'express';
import {
  getRates,
  getActiveRate,
  createRate,
  updateRate,
  setActiveRate,
  syncDolarVzlaRates
} from '../controllers/rates.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, getRates);
router.get('/active', getActiveRate); // Acceso público para tienda virtual
router.post('/', authenticate, requireAdmin, createRate);
router.post('/sync-dolarvzla', authenticate, requireAdmin, syncDolarVzlaRates); // Requiere rol Admin
router.put('/:id', authenticate, requireAdmin, updateRate);
router.patch('/:id/set-active', authenticate, requireAdmin, setActiveRate);

export default router;
