import express from 'express';
import PropertyController from '../controllers/propertyController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', PropertyController.getAllProperties);
router.get('/approved', PropertyController.getApprovedProperties);
router.get('/approval/approved', protect, authorize('ADMIN'), PropertyController.getApprovedForApproval);
router.get('/approval/rejected', protect, authorize('ADMIN'), PropertyController.getRejectedForApproval);
router.get('/count', PropertyController.countAllProperties);
router.get('/approved/count', PropertyController.countApprovedProperties);
router.get('/search', PropertyController.searchProperties);
router.get('/advanced-search', PropertyController.advancedSearch);
router.get('/filters/meta', PropertyController.getFilterMeta);
router.get('/id/:id', PropertyController.getPropertyById); // Use /id/:id for safer routing
router.get('/:id', PropertyController.getPropertyById);
router.get('/public/:id', PropertyController.getPropertyById);

// Protected routes
router.post('/', protect, PropertyController.createProperty);
router.get('/my', protect, PropertyController.getMyProperties);
router.put('/:id', protect, PropertyController.updateProperty);
router.delete('/:id', protect, PropertyController.deleteProperty);
router.patch('/:id/assign-owner', protect, PropertyController.claimOwnership);

// Admin-only routes
router.get('/approval/pending', protect, authorize('ADMIN'), PropertyController.getPendingForApproval);
router.patch('/:id/approve', protect, authorize('ADMIN'), PropertyController.approveProperty);
router.patch('/:id/reject', protect, authorize('ADMIN'), PropertyController.rejectProperty);

export default router;
