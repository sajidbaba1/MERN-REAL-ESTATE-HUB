import express from 'express';
import AnalyticsController from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN'));

router.get('/summary', AnalyticsController.getSummary);
router.get('/dashboard', AnalyticsController.getDashboardStats);
router.get('/export/business-data', AnalyticsController.exportBusinessData);

// New endpoints for frontend analytics dashboard
router.get('/property-types', AnalyticsController.getPropertyTypes);
router.get('/properties-by-city', AnalyticsController.getPropertiesByCity);
router.get('/user-trends', AnalyticsController.getUserTrends);
router.get('/property-trends', AnalyticsController.getPropertyTrends);
router.get('/timeseries', AnalyticsController.getTimeseries);
router.get('/funnel', AnalyticsController.getFunnelStats);
router.get('/agent-performance', AnalyticsController.getAgentPerformance);
router.get('/recent-activity', AnalyticsController.getRecentActivity);

export default router;
