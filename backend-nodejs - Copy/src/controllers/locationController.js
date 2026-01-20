import Location from '../models/Location.js';

class LocationController {
    async getAllLocations(req, res) {
        try {
            const locations = await Location.find().sort({ name: 1 });
            res.json(locations);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getLocationById(req, res) {
        try {
            const location = await Location.findById(req.params.id);
            if (!location) return res.status(404).json({ message: 'Location not found' });
            res.json(location);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async searchLocations(req, res) {
        try {
            const { keyword } = req.query;
            const locations = await Location.find({
                $or: [
                    { name: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ]
            }).sort({ name: 1 });
            res.json(locations);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createLocation(req, res) {
        try {
            const { name, description } = req.body;
            const existing = await Location.findOne({ name });
            if (existing) return res.status(409).json({ message: `Location with name '${name}' already exists` });

            const location = new Location({ name, description });
            const saved = await location.save();
            res.status(201).json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateLocation(req, res) {
        try {
            const { name, description } = req.body;
            const location = await Location.findById(req.params.id);
            if (!location) return res.status(404).json({ message: 'Location not found' });

            // Name conflict check (excluding current)
            if (name && name !== location.name) {
                const existing = await Location.findOne({ name });
                if (existing) return res.status(409).json({ message: `Location with name '${name}' already exists` });
                location.name = name;
            }

            if (description !== undefined) location.description = description;

            const saved = await location.save();
            res.json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async deleteLocation(req, res) {
        try {
            const location = await Location.findById(req.params.id);
            if (!location) return res.status(404).json({ message: 'Location not found' });

            await Location.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new LocationController();
