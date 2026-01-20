import express from 'express';
import LocationController from '../controllers/locationController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public
router.get('/', LocationController.getAllLocations);
router.get('/search', LocationController.searchLocations);
router.get('/:id', LocationController.getLocationById);

// Admin only
router.post('/', protect, authorize('ADMIN'), LocationController.createLocation);
router.put('/:id', protect, authorize('ADMIN'), LocationController.updateLocation);
router.delete('/:id', protect, authorize('ADMIN'), LocationController.deleteLocation);

export default router;
