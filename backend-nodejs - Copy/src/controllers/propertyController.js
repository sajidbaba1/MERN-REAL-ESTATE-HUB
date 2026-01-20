import Property from '../models/Property.js';
import User from '../models/User.js';

class PropertyController {
    // Get all properties
    async getAllProperties(req, res) {
        try {
            const properties = await Property.find().populate('owner', 'firstName lastName email');
            res.json(properties);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Public: Get only APPROVED properties
    async getApprovedProperties(req, res) {
        try {
            const properties = await Property.find({ approvalStatus: 'APPROVED' }).populate('owner', 'firstName lastName email');
            res.json(properties);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Counts
    async countAllProperties(req, res) {
        try {
            const total = await Property.countDocuments();
            res.json({ total });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async countApprovedProperties(req, res) {
        try {
            const approved = await Property.countDocuments({ approvalStatus: 'APPROVED' });
            res.json({ approved });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get property by ID
    async getPropertyById(req, res) {
        try {
            // Check if ID is valid MongoDB ObjectId
            if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
                return res.status(404).json({ message: 'Property not found' });
            }

            const property = await Property.findById(req.params.id).populate('owner', 'firstName lastName email');
            if (!property) return res.status(404).json({ message: 'Property not found' });
            res.json(property);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Create new property
    async createProperty(req, res) {
        try {
            const property = new Property(req.body);
            if (req.user) {
                property.owner = req.user._id;
            }
            const savedProperty = await property.save();
            res.status(201).json(savedProperty);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Update property
    async updateProperty(req, res) {
        try {
            const property = await Property.findById(req.params.id);
            if (!property) return res.status(404).json({ message: 'Property not found' });

            // Authorization
            console.log('Update Request from User:', req.user.email, 'Role:', req.user.role);
            console.log('Property Owner:', property.owner);
            const isAdmin = req.user.role === 'ADMIN';
            const isOwner = property.owner && property.owner.toString() === req.user._id.toString();

            console.log('isAdmin:', isAdmin, 'isOwner:', isOwner);

            if (!isAdmin && !isOwner) {
                console.log('AUTH FAILED: Returning 403 Forbidden');
                return res.status(403).json({ message: 'Forbidden' });
            }

            Object.assign(property, req.body);
            // Ensure owner doesn't change from request body
            if (isOwner && !isAdmin) {
                property.owner = req.user._id;
            }

            const updatedProperty = await property.save();
            res.json(updatedProperty);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    // Delete property
    async deleteProperty(req, res) {
        try {
            const property = await Property.findById(req.params.id);
            if (!property) return res.status(404).json({ message: 'Property not found' });

            // Authorization
            const isAdmin = req.user.role === 'ADMIN';
            const isOwner = property.owner && property.owner.toString() === req.user._id.toString();
            if (!isAdmin && !isOwner) {
                return res.status(403).json({ message: 'Forbidden' });
            }

            await Property.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get my properties
    async getMyProperties(req, res) {
        try {
            const properties = await Property.find({ owner: req.user._id })
                .populate('owner', 'firstName lastName email')
                .sort({ createdAt: -1 });
            res.json(properties);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Search by keyword
    async searchProperties(req, res) {
        try {
            const { keyword } = req.query;
            const query = {
                $or: [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } },
                    { city: { $regex: keyword, $options: 'i' } },
                    { address: { $regex: keyword, $options: 'i' } }
                ],
                approvalStatus: 'APPROVED'
            };
            const properties = await Property.find(query).populate('owner', 'firstName lastName email');
            res.json(properties);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Advanced search
    async advancedSearch(req, res) {
        try {
            const {
                keyword, city, state, propertyType,
                minPrice, maxPrice,
                minBedrooms, maxBedrooms,
                minBathrooms, maxBathrooms,
                status
            } = req.query;

            const query = { approvalStatus: 'APPROVED' };

            if (keyword) {
                query.$or = [
                    { title: { $regex: keyword, $options: 'i' } },
                    { description: { $regex: keyword, $options: 'i' } }
                ];
            }
            if (city) query.city = { $regex: city, $options: 'i' };
            if (state) query.state = { $regex: state, $options: 'i' };
            if (propertyType) query.propertyType = propertyType;
            if (status) query.status = status;

            if (minPrice || maxPrice) {
                query.price = {};
                if (minPrice) query.price.$gte = Number(minPrice);
                if (maxPrice) query.price.$lte = Number(maxPrice);
            }

            if (minBedrooms || maxBedrooms) {
                query.bedrooms = {};
                if (minBedrooms) query.bedrooms.$gte = Number(minBedrooms);
                if (maxBedrooms) query.bedrooms.$lte = Number(maxBedrooms);
            }

            if (minBathrooms || maxBathrooms) {
                query.bathrooms = {};
                if (minBathrooms) query.bathrooms.$gte = Number(minBathrooms);
                if (maxBathrooms) query.bathrooms.$lte = Number(maxBathrooms);
            }

            const properties = await Property.find(query).populate('owner', 'firstName lastName email');
            res.json(properties);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Approval actions (ADMIN)
    async approveProperty(req, res) {
        try {
            const property = await Property.findByIdAndUpdate(
                req.params.id,
                { approvalStatus: 'APPROVED' },
                { new: true }
            );
            if (!property) return res.status(404).json({ message: 'Property not found' });
            res.json(property);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async rejectProperty(req, res) {
        try {
            const property = await Property.findByIdAndUpdate(
                req.params.id,
                { approvalStatus: 'REJECTED' },
                { new: true }
            );
            if (!property) return res.status(404).json({ message: 'Property not found' });
            res.json(property);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPendingForApproval(req, res) {
        try {
            const list = await Property.find({ approvalStatus: 'PENDING' }).populate('owner', 'firstName lastName email').sort({ createdAt: -1 });
            res.json(list);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getApprovedForApproval(req, res) {
        try {
            const list = await Property.find({ approvalStatus: 'APPROVED' }).populate('owner', 'firstName lastName email').sort({ updatedAt: -1 });
            res.json(list);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getRejectedForApproval(req, res) {
        try {
            const list = await Property.find({ approvalStatus: 'REJECTED' }).populate('owner', 'firstName lastName email').sort({ updatedAt: -1 });
            res.json(list);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getFilterMeta(req, res) {
        try {
            const cities = await Property.distinct('city');
            const states = await Property.distinct('state');
            const minPriceArr = await Property.find().sort({ price: 1 }).limit(1);
            const maxPriceArr = await Property.find().sort({ price: -1 }).limit(1);

            res.json({
                cities,
                states,
                minPrice: minPriceArr[0]?.price || 0,
                maxPrice: maxPriceArr[0]?.price || 0
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Assign owner (Claim Ownership)
    async claimOwnership(req, res) {
        try {
            const property = await Property.findById(req.params.id);
            if (!property) return res.status(404).json({ message: 'Property not found' });

            // Allow only Agents or Admins
            console.log('Claim Request from User:', req.user.email, 'Role:', req.user.role);
            if (req.user.role !== 'AGENT' && req.user.role !== 'ADMIN') {
                console.log('CLAIM FAILED: Role', req.user.role, 'is not AGENT or ADMIN');
                return res.status(403).json({ message: 'Only Agents or Admins can claim properties' });
            }

            // For PROD: Prevent claiming if already owned. 
            // For DEMO: Allow Agents to claim any property to enable editing features easily.
            // if (property.owner && req.user.role !== 'ADMIN') {
            //      return res.status(403).json({ message: 'Property already has an owner' });
            // }

            property.owner = req.user._id;
            const updated = await property.save();
            // Populate owner to return full details
            await updated.populate('owner', 'firstName lastName email');
            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new PropertyController();
