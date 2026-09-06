import { Router } from 'express';
import { getProducts, getProductById, getProductByBarcode, createProduct, updateProduct, deleteProduct } from '../controllers/products.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';

const router = Router();
router.get('/', getProducts); // Acceso público para tienda
router.get('/barcode/:barcode', getProductByBarcode); // Búsqueda rápida por lector
router.get('/:id', getProductById);
router.post('/', authenticate, createProduct);
router.put('/:id', authenticate, updateProduct);
router.delete('/:id', authenticate, requireAdmin, deleteProduct);

export default router;
