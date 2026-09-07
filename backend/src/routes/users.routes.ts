import { Router } from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/users.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();

// All user management routes require valid token and ADMIN role
router.use(authenticate);
router.use(requireAdmin);

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
