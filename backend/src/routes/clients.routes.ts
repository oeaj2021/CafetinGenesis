import { Router } from 'express';
import { getClients, getClientById, createClient, updateClient } from '../controllers/clients.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', getClients);
router.get('/:id', getClientById);
router.post('/', createClient);
router.put('/:id', updateClient);

export default router;
