import express from 'express';
import UserController from '../controllers/userController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/profile', UserController.getUserProfile);
router.put('/profile', UserController.updateUserProfile);
router.get('/stats', UserController.getUserStats);

// Favorites
router.get('/favorites', UserController.getUserFavorites);
router.post('/favorites/:propertyId', UserController.addToFavorites);
router.delete('/favorites/:propertyId', UserController.removeFromFavorites);
router.get('/favorites/:propertyId/check', UserController.checkIfFavorite);

export default router;
