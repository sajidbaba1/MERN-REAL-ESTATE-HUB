import express from 'express';
import PgController from '../controllers/pgController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public/rooms/property/:propertyId', PgController.listRoomsPublic);
router.get('/public/beds/room/:roomId', PgController.listBedsPublic);

router.use(protect);
router.use(authorize('ADMIN', 'AGENT'));

// Rooms
router.get('/rooms/property/:propertyId', PgController.listRoomsForProperty);
router.post('/rooms', PgController.createRoom);
router.put('/rooms/:roomId', PgController.updateRoom);
router.delete('/rooms/:roomId', PgController.deleteRoom);

// Beds
router.get('/beds/room/:roomId', PgController.listBeds);
router.post('/beds', PgController.createBed);
router.delete('/beds/:bedId', PgController.deleteBed);

export default router;
