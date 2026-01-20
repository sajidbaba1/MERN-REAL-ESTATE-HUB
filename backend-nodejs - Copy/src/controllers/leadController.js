import Lead from '../models/Lead.js';
import User from '../models/User.js';

class LeadController {
    async create(req, res) {
        try {
            const { customerName, customerEmail, customerPhone, source, city, notes, budgetMin, budgetMax, assignedAgentId } = req.body;

            const lead = new Lead({
                customerName,
                customerEmail,
                customerPhone,
                source: source || 'PORTAL',
                city,
                notes,
                budgetMin: budgetMin ? Number(budgetMin) : undefined,
                budgetMax: budgetMax ? Number(budgetMax) : undefined,
                assignedAgent: assignedAgentId || req.user.id
            });

            const saved = await lead.save();
            res.status(201).json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async list(req, res) {
        try {
            const { stage, city, mine } = req.query;
            const isAdmin = req.user.role === 'ADMIN';
            const isMine = mine === 'true';

            const query = {};
            if (stage) query.stage = stage;
            if (city) query.city = { $regex: city, $options: 'i' };

            if (!isAdmin || isMine) {
                query.assignedAgent = req.user.id;
            }

            const leads = await Lead.find(query).populate('assignedAgent', 'firstName lastName email');
            res.json(leads);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async update(req, res) {
        try {
            const lead = await Lead.findById(req.params.id);
            if (!lead) return res.status(404).json({ message: 'Lead not found' });

            const isAdmin = req.user.role === 'ADMIN';
            const isAssigned = lead.assignedAgent && lead.assignedAgent.toString() === req.user.id;
            if (!isAdmin && !isAssigned) return res.status(403).json({ message: 'Forbidden' });

            const { stage, notes, city } = req.body;
            if (stage) lead.stage = stage;
            if (notes) lead.notes = notes;
            if (city) lead.city = city;

            const saved = await lead.save();
            res.json(saved);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async getOne(req, res) {
        try {
            const lead = await Lead.findById(req.params.id).populate('assignedAgent', 'firstName lastName email');
            if (!lead) return res.status(404).json({ message: 'Lead not found' });

            const isAdmin = req.user.role === 'ADMIN';
            const isAssigned = lead.assignedAgent && lead.assignedAgent._id.toString() === req.user.id;
            if (!isAdmin && !isAssigned) return res.status(403).json({ message: 'Forbidden' });

            res.json(lead);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new LeadController();
