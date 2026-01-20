import express from 'express';
import BookingController from '../controllers/bookingController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/rent', BookingController.createRentBooking);
router.post('/pg', BookingController.createPgBooking);
router.get('/my', BookingController.getMyBookings);
router.get('/owner', BookingController.getOwnerBookings);
router.get('/payments/my', BookingController.getMyPayments);
router.post('/payments/:paymentId/pay', BookingController.payMonthlyRent);

export default router;
