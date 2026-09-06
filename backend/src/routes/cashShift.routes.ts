import { Router } from 'express';
import { getCurrentShift, openShift, closeShift, getShiftHistory } from '../controllers/cashShift.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/current', getCurrentShift);
router.post('/open', openShift);
router.post('/close', closeShift);
router.get('/history', getShiftHistory);

export default router;
