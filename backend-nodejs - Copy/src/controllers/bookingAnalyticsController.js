import RentBooking from '../models/RentBooking.js';
import PgBooking from '../models/PgBooking.js';
import MonthlyPayment from '../models/MonthlyPayment.js';
import Property from '../models/Property.js';
import User from '../models/User.js';
import BookingReview from '../models/BookingReview.js';

class BookingAnalyticsController {
    // Get overview stats
    async getOverviewStats(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const isAdmin = req.user.role === 'ADMIN';
            const ownerId = isAdmin ? null : req.user.id;

            const stats = {};

            if (isAdmin) {
                stats.totalActiveRentBookings = await RentBooking.countDocuments({ status: 'ACTIVE' });
                stats.totalActivePgBookings = await PgBooking.countDocuments({ status: 'ACTIVE' });
                stats.pendingApprovals =
                    await RentBooking.countDocuments({ status: 'PENDING_APPROVAL' }) +
                    await PgBooking.countDocuments({ status: 'PENDING_APPROVAL' });
                stats.totalRevenue = await this.calculateTotalRevenue(null, startDate, endDate);
                stats.overduePayments = await MonthlyPayment.countDocuments({
                    status: 'OVERDUE',
                    dueDate: { $lt: new Date() }
                });
            } else {
                stats.totalActiveRentBookings = await RentBooking.countDocuments({ owner: ownerId, status: 'ACTIVE' });
                stats.totalActivePgBookings = await PgBooking.countDocuments({ owner: ownerId, status: 'ACTIVE' });
                stats.pendingApprovals =
                    await RentBooking.countDocuments({ owner: ownerId, status: 'PENDING_APPROVAL' }) +
                    await PgBooking.countDocuments({ owner: ownerId, status: 'PENDING_APPROVAL' });
                stats.totalRevenue = await this.calculateTotalRevenue(ownerId, startDate, endDate);
                stats.overduePayments = await MonthlyPayment.countDocuments({
                    owner: ownerId,
                    status: 'OVERDUE',
                    dueDate: { $lt: new Date() }
                });
            }

            res.json(stats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get revenue analytics
    async getRevenueAnalytics(req, res) {
        try {
            const period = req.query.period || 'monthly';
            const periods = parseInt(req.query.periods) || 12;
            const isAdmin = req.user.role === 'ADMIN';
            const ownerId = isAdmin ? null : req.user.id;

            const revenueData = [];
            const currentDate = new Date();

            for (let i = periods - 1; i >= 0; i--) {
                let startDate, endDate, label;

                if (period === 'monthly') {
                    startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
                    endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
                    label = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                } else {
                    startDate = new Date(currentDate);
                    startDate.setDate(startDate.getDate() - (i * 7));
                    endDate = new Date(startDate);
                    endDate.setDate(endDate.getDate() + 6);
                    label = `Week ${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
                }

                const revenue = await this.calculateTotalRevenue(ownerId, startDate, endDate);

                revenueData.push({
                    period: label,
                    revenue,
                    startDate,
                    endDate
                });
            }

            res.json(revenueData);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get booking trends
    async getBookingTrends(req, res) {
        try {
            const days = parseInt(req.query.days) || 30;
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);

            const isAdmin = req.user.role === 'ADMIN';
            const ownerId = isAdmin ? null : req.user.id;

            const query = ownerId ? { owner: ownerId } : {};

            const trends = {
                newBookings:
                    await RentBooking.countDocuments({ ...query, createdAt: { $gte: startDate, $lte: endDate } }) +
                    await PgBooking.countDocuments({ ...query, createdAt: { $gte: startDate, $lte: endDate } }),
                approvedBookings:
                    await RentBooking.countDocuments({ ...query, approvalDate: { $gte: startDate, $lte: endDate } }) +
                    await PgBooking.countDocuments({ ...query, approvalDate: { $gte: startDate, $lte: endDate } }),
                cancelledBookings:
                    await RentBooking.countDocuments({ ...query, status: 'CANCELLED', updatedAt: { $gte: startDate, $lte: endDate } }) +
                    await PgBooking.countDocuments({ ...query, status: 'CANCELLED', updatedAt: { $gte: startDate, $lte: endDate } })
            };

            res.json(trends);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get payment analytics
    async getPaymentAnalytics(req, res) {
        try {
            const isAdmin = req.user.role === 'ADMIN';
            const query = isAdmin ? {} : { owner: req.user.id };

            const paymentStats = {
                totalPending: await MonthlyPayment.countDocuments({ ...query, status: 'PENDING' }),
                totalOverdue: await MonthlyPayment.countDocuments({ ...query, status: 'OVERDUE' }),
                totalPaid: await MonthlyPayment.countDocuments({ ...query, status: 'PAID' })
            };

            // Calculate amounts
            const pendingSum = await MonthlyPayment.aggregate([
                { $match: { ...query, status: 'PENDING' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const overdueSum = await MonthlyPayment.aggregate([
                { $match: { ...query, status: 'OVERDUE' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            paymentStats.pendingAmount = pendingSum[0]?.total || 0;
            paymentStats.overdueAmount = overdueSum[0]?.total || 0;

            res.json(paymentStats);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get property performance
    async getPropertyPerformance(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const isAdmin = req.user.role === 'ADMIN';
            const query = isAdmin ? {} : { owner: req.user.id };

            const properties = await Property.find(query);
            const propertyPerformance = [];

            for (const property of properties) {
                const totalRentBookings = await RentBooking.countDocuments({ property: property._id });
                const activeRentBookings = await RentBooking.countDocuments({ property: property._id, status: 'ACTIVE' });

                const revenueResult = await MonthlyPayment.aggregate([
                    {
                        $match: {
                            property: property._id,
                            createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
                        }
                    },
                    { $group: { _id: null, total: { $sum: '$amount' } } }
                ]);

                const avgRatingResult = await BookingReview.aggregate([
                    { $match: { property: property._id } },
                    { $group: { _id: null, avgRating: { $avg: '$rating' } } }
                ]);

                propertyPerformance.push({
                    property,
                    totalBookings: totalRentBookings,
                    activeBookings: activeRentBookings,
                    occupancyRate: totalRentBookings > 0 ? (activeRentBookings / totalRentBookings) * 100 : 0,
                    annualRevenue: revenueResult[0]?.total || 0,
                    averageRating: avgRatingResult[0]?.avgRating || 0
                });
            }

            // Sort by revenue
            propertyPerformance.sort((a, b) => b.annualRevenue - a.annualRevenue);
            const topProperties = propertyPerformance.slice(0, limit);

            res.json(topProperties);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Helper method
    async calculateTotalRevenue(ownerId, startDate, endDate) {
        const query = {
            status: 'PAID',
            paidAt: { $gte: startDate, $lte: endDate }
        };

        if (ownerId) {
            query.owner = ownerId;
        }

        const result = await MonthlyPayment.aggregate([
            { $match: query },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        return result[0]?.total || 0;
    }
}

export default new BookingAnalyticsController();
