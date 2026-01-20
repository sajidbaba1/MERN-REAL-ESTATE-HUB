import Property from '../models/Property.js';
import User from '../models/User.js';
import PropertyInquiry from '../models/PropertyInquiry.js';
import ChatMessage from '../models/ChatMessage.js';

class AnalyticsController {
    // KPIs
    async getSummary(req, res) {
        try {
            const totalUsers = await User.countDocuments();
            const totalProperties = await Property.countDocuments();
            const totalInquiries = await PropertyInquiry.countDocuments();

            const avgPriceArr = await Property.aggregate([
                { $match: { price: { $exists: true, $ne: null } } },
                { $group: { _id: null, avgPrice: { $avg: '$price' } } }
            ]);
            const avgPrice = avgPriceArr[0]?.avgPrice || 0;

            res.json({
                totalUsers,
                totalProperties,
                totalInquiries,
                averagePrice: avgPrice
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPropertyTypes(req, res) {
        try {
            const stats = await Property.aggregate([
                {
                    $group: {
                        _id: '$propertyType',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const formattedStats = stats.map(item => ({
                propertyType: item._id,
                count: item.count
            }));

            res.json(formattedStats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPropertiesByCity(req, res) {
        try {
            const stats = await Property.aggregate([
                {
                    $group: {
                        _id: '$city',
                        count: { $sum: 1 }
                    }
                },
                { $sort: { count: -1 } },
                { $limit: 10 }
            ]);

            const formattedStats = stats.map(item => ({
                city: item._id,
                count: item.count
            }));

            res.json(formattedStats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getUserTrends(req, res) {
        try {
            const { rangeDays = 30 } = req.query;
            const days = parseInt(rangeDays);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const stats = await User.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const formattedStats = stats.map(item => ({
                date: item._id,
                count: item.count
            }));

            res.json(formattedStats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getPropertyTrends(req, res) {
        try {
            const { rangeDays = 30 } = req.query;
            const days = parseInt(rangeDays);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const stats = await Property.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const formattedStats = stats.map(item => ({
                date: item._id,
                count: item.count
            }));

            res.json(formattedStats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getTimeseries(req, res) {
        try {
            const { metric, rangeDays = 30 } = req.query;
            const days = parseInt(rangeDays);
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            let Model;
            if (metric === 'users') Model = User;
            else if (metric === 'properties') Model = Property;
            else if (metric === 'inquiries') Model = PropertyInquiry;
            else return res.status(400).json({ message: 'Invalid metric' });

            const stats = await Model.aggregate([
                { $match: { createdAt: { $gte: startDate } } },
                {
                    $group: {
                        _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        value: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            const formattedStats = stats.map(item => ({
                date: item._id,
                value: item.value
            }));

            res.json(formattedStats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getFunnelStats(req, res) {
        try {
            const totalVisits = 1000; // Mock data for visits
            const totalInquiries = await PropertyInquiry.countDocuments();
            const totalBookings = await PropertyInquiry.countDocuments({ status: 'ACCEPTED' });

            res.json([
                { stage: 'Visits', count: totalVisits },
                { stage: 'Inquiries', count: totalInquiries },
                { stage: 'Bookings', count: totalBookings }
            ]);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getAgentPerformance(req, res) {
        try {
            // Mock data for agent performance
            const agents = await User.find({ role: 'AGENT' }).limit(5);

            const stats = await Promise.all(agents.map(async (agent) => {
                const properties = await Property.countDocuments({ owner: agent._id });
                const inquiries = await PropertyInquiry.countDocuments({ owner: agent._id });
                const revenue = await PropertyInquiry.aggregate([
                    { $match: { owner: agent._id, status: 'ACCEPTED' } },
                    { $group: { _id: null, total: { $sum: '$agreedPrice' } } }
                ]);

                return {
                    agentId: agent._id,
                    agentName: `${agent.firstName} ${agent.lastName}`,
                    properties,
                    inquiries,
                    revenue: revenue[0]?.total || 0
                };
            }));

            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getRecentActivity(req, res) {
        try {
            const properties = await Property.find().sort({ createdAt: -1 }).limit(5).populate('owner', 'firstName lastName');
            const users = await User.find().sort({ createdAt: -1 }).limit(5);

            const activities = [
                ...properties.map(p => ({
                    type: 'PROPERTY_CREATED',
                    message: `New property listed: ${p.title}`,
                    date: p.createdAt,
                    user: p.owner ? `${p.owner.firstName} ${p.owner.lastName}` : 'Unknown'
                })),
                ...users.map(u => ({
                    type: 'USER_REGISTERED',
                    message: `New user registered: ${u.firstName} ${u.lastName}`,
                    date: u.createdAt,
                    user: `${u.firstName} ${u.lastName}`
                }))
            ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

            res.json(activities);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Dashboard stats
    async getDashboardStats(req, res) {
        try {
            const [users, props, pricing] = await Promise.all([
                User.aggregate([
                    { $group: { _id: '$role', count: { $sum: 1 } } }
                ]),
                Property.aggregate([
                    { $group: { _id: '$status', count: { $sum: 1 } } }
                ]),
                Property.aggregate([
                    {
                        $group: {
                            _id: null,
                            average: { $avg: '$price' },
                            minimum: { $min: '$price' },
                            maximum: { $max: '$price' }
                        }
                    }
                ])
            ]);

            const usersMap = { total: 0, ADMIN: 0, AGENT: 0, USER: 0 };
            users.forEach(u => {
                usersMap[u._id] = u.count;
                usersMap.total += u.count;
            });

            const propsMap = { total: 0, FOR_SALE: 0, FOR_RENT: 0, SOLD: 0, RENTED: 0 };
            props.forEach(p => {
                propsMap[p._id] = p.count;
                propsMap.total += p.count;
            });

            res.json({
                users: {
                    total: usersMap.total,
                    admins: usersMap.ADMIN,
                    agents: usersMap.AGENT,
                    clients: usersMap.USER
                },
                properties: {
                    total: propsMap.total,
                    forSale: propsMap.FOR_SALE,
                    forRent: propsMap.FOR_RENT,
                    sold: propsMap.SOLD,
                    rented: propsMap.RENTED
                },
                pricing: {
                    average: pricing[0]?.average || 0,
                    minimum: pricing[0]?.minimum || 0,
                    maximum: pricing[0]?.maximum || 0
                }
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Export for RAG
    async exportBusinessData(req, res) {
        try {
            const [props, inqs, msgs] = await Promise.all([
                Property.find(),
                PropertyInquiry.find(),
                ChatMessage.find()
            ]);

            const payload = {
                properties: props.map(p => ({
                    type: 'property',
                    id: p._id,
                    title: p.title,
                    city: p.city,
                    state: p.state,
                    price: p.price,
                    status: p.status
                })),
                inquiries: inqs.map(q => ({
                    type: 'inquiry',
                    id: q._id,
                    propertyId: q.property,
                    clientId: q.client,
                    ownerId: q.owner,
                    status: q.status,
                    offeredPrice: q.offeredPrice,
                    agreedPrice: q.agreedPrice,
                    createdAt: q.createdAt,
                    updatedAt: q.updatedAt
                })),
                messages: msgs.map(m => ({
                    type: 'message',
                    id: m._id,
                    inquiryId: m.inquiry,
                    senderId: m.sender,
                    messageType: m.messageType,
                    content: m.content,
                    priceAmount: m.priceAmount,
                    sentAt: m.createdAt
                }))
            };

            res.json(payload);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new AnalyticsController();
