import express from 'express';
import WalletController from '../controllers/walletController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', WalletController.getMyWallet);
router.post('/pay/order', WalletController.createWalletOrder);
router.post('/pay/verify', WalletController.verifyWalletPayment);
router.get('/transactions', WalletController.getMyTransactions);
router.post('/add', WalletController.addMoney);

export default router;
