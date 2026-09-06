import { Router } from 'express';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../controllers/categories.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', getCategories); // Acceso público para tienda
router.post('/', authenticate, createCategory);
router.put('/:id', authenticate, updateCategory);
router.delete('/:id', authenticate, requireAdmin, deleteCategory);

export default router;
