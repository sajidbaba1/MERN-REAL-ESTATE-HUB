import express from 'express';
import PaymentController from '../controllers/paymentController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/order', PaymentController.createOrder);
router.post('/verify', PaymentController.verifyPayment);

export default router;
