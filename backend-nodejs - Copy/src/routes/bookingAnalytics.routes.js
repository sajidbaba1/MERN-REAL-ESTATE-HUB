import express from 'express';
import BookingAnalyticsController from '../controllers/bookingAnalyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'AGENT'));

router.get('/overview', BookingAnalyticsController.getOverviewStats);
router.get('/revenue', BookingAnalyticsController.getRevenueAnalytics);
router.get('/booking-trends', BookingAnalyticsController.getBookingTrends);
router.get('/payments', BookingAnalyticsController.getPaymentAnalytics);
router.get('/property-performance', BookingAnalyticsController.getPropertyPerformance);

export default router;
