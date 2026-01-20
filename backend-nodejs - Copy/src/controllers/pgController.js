import PgRoom from '../models/PgRoom.js';
import PgBed from '../models/PgBed.js';
import Property from '../models/Property.js';

class PgController {
    async listRoomsForProperty(req, res) {
        try {
            const property = await Property.findById(req.params.propertyId);
            if (!property) return res.status(404).json({ message: 'Property not found' });
            if (!this.canManageProperty(property, req.user)) return res.status(403).json({ message: 'Forbidden' });

            const rooms = await PgRoom.find({ property: req.params.propertyId });
            res.json(rooms);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async listRoomsPublic(req, res) {
        try {
            const rooms = await PgRoom.find({ property: req.params.propertyId });
            res.json(rooms);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createRoom(req, res) {
        try {
            const { propertyId, roomNumber, description, roomType, roomCategory, privateRoomPrice, bedPrice, totalBeds, roomSizeSqft } = req.body;
            const property = await Property.findById(propertyId);
            if (!property) return res.status(404).json({ message: 'Property not found' });
            if (!this.canManageProperty(property, req.user)) return res.status(403).json({ message: 'Forbidden' });
            if (!property.isPgListing) return res.status(400).json({ message: 'Property is not marked as PG listing' });

            const room = new PgRoom({
                property: propertyId,
                roomNumber,
                description,
                roomType,
                roomCategory,
                roomSizeSqft
            });

            if (roomType === 'PRIVATE') {
                room.privateRoomPrice = privateRoomPrice;
                room.totalBeds = 1;
                room.availableBeds = 1;
            } else {
                room.bedPrice = bedPrice;
                room.totalBeds = totalBeds || 0;
                room.availableBeds = room.totalBeds;
            }

            const saved = await room.save();
            res.status(201).json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateRoom(req, res) {
        try {
            const room = await PgRoom.findById(req.params.roomId).populate('property');
            if (!room) return res.status(404).json({ message: 'Room not found' });
            if (!this.canManageProperty(room.property, req.user)) return res.status(403).json({ message: 'Forbidden' });

            const { roomNumber, description, roomCategory, roomSizeSqft, privateRoomPrice, bedPrice, totalBeds } = req.body;

            if (roomNumber !== undefined) room.roomNumber = roomNumber;
            if (description !== undefined) room.description = description;
            if (roomCategory !== undefined) room.roomCategory = roomCategory;
            if (roomSizeSqft !== undefined) room.roomSizeSqft = roomSizeSqft;

            if (room.roomType === 'PRIVATE') {
                if (privateRoomPrice !== undefined) room.privateRoomPrice = privateRoomPrice;
            } else {
                if (bedPrice !== undefined) room.bedPrice = bedPrice;
                if (totalBeds !== undefined) {
                    const delta = totalBeds - (room.totalBeds || 0);
                    room.totalBeds = totalBeds;
                    if (delta > 0) room.availableBeds = (room.availableBeds || 0) + delta;
                }
            }

            const saved = await room.save();
            res.json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteRoom(req, res) {
        try {
            const room = await PgRoom.findById(req.params.roomId).populate('property');
            if (!room) return res.status(404).json({ message: 'Room not found' });
            if (!this.canManageProperty(room.property, req.user)) return res.status(403).json({ message: 'Forbidden' });

            await PgRoom.findByIdAndDelete(req.params.roomId);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async listBeds(req, res) {
        try {
            const room = await PgRoom.findById(req.params.roomId).populate('property');
            if (!room) return res.status(404).json({ message: 'Room not found' });
            if (!this.canManageProperty(room.property, req.user)) return res.status(403).json({ message: 'Forbidden' });

            const beds = await PgBed.find({ room: req.params.roomId });
            res.json(beds);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async listBedsPublic(req, res) {
        try {
            const beds = await PgBed.find({ room: req.params.roomId });
            res.json(beds);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createBed(req, res) {
        try {
            const { roomId, bedNumber } = req.body;
            const room = await PgRoom.findById(roomId).populate('property');
            if (!room) return res.status(404).json({ message: 'Room not found' });
            if (room.roomType !== 'SHARED') return res.status(400).json({ message: 'Beds are only for SHARED rooms' });
            if (!this.canManageProperty(room.property, req.user)) return res.status(403).json({ message: 'Forbidden' });

            const bed = new PgBed({ room: roomId, bedNumber });
            const saved = await bed.save();

            room.totalBeds = (room.totalBeds || 0) + 1;
            room.availableBeds = (room.availableBeds || 0) + 1;
            await room.save();

            res.status(201).json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteBed(req, res) {
        try {
            const bed = await PgBed.findById(req.params.bedId).populate({
                path: 'room',
                populate: { path: 'property' }
            });
            if (!bed) return res.status(404).json({ message: 'Bed not found' });
            if (!this.canManageProperty(bed.room.property, req.user)) return res.status(403).json({ message: 'Forbidden' });

            const room = bed.room;
            await PgBed.findByIdAndDelete(req.params.bedId);

            if (room.totalBeds > 0) room.totalBeds -= 1;
            if (room.availableBeds > 0) room.availableBeds -= 1;
            await room.save();

            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Helper
    canManageProperty(property, user) {
        if (user.role === 'ADMIN') return true;
        return property.owner && property.owner.toString() === user.id;
    }
}

export default new PgController();
