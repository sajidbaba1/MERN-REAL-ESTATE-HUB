import express from 'express';
import OtpController from '../controllers/otpController.js';

const router = express.Router();

router.post('/send', OtpController.sendOtp);
router.post('/verify', OtpController.verifyOtp);
router.get('/status', OtpController.getOtpStatus);

export default router;
