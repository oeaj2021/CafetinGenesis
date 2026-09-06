import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settings.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', getSettings); // Acceso público para obtener WhatsApp, Nombre, RIF
router.post('/', authenticate, requireAdmin, updateSettings);

export default router;
