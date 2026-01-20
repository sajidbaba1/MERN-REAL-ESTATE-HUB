import RentBooking from '../models/RentBooking.js';
import PgBooking from '../models/PgBooking.js';
import Property from '../models/Property.js';
import PgBed from '../models/PgBed.js';
import MonthlyPayment from '../models/MonthlyPayment.js';
import walletService from '../services/walletService.js';

class BookingController {
    // Create rent booking
    async createRentBooking(req, res) {
        try {
            const { propertyId, startDate, endDate, monthlyRent, securityDeposit } = req.body;
            const property = await Property.findById(propertyId);
            if (!property) return res.status(404).json({ message: 'Property not found' });

            if (property.status !== 'FOR_RENT') {
                return res.status(400).json({ message: 'Property is not available for rent' });
            }

            // Conflict check (simplified for now)
            const existing = await RentBooking.findOne({
                property: propertyId,
                status: { $in: ['ACTIVE', 'PENDING_APPROVAL'] },
                $or: [
                    { startDate: { $lte: new Date(startDate) }, endDate: { $gte: new Date(startDate) } },
                    { startDate: { $lte: new Date(endDate || '2099-12-31') }, endDate: { $gte: new Date(endDate || '2099-12-31') } }
                ]
            });

            if (existing) {
                return res.status(400).json({ message: 'Property is not available for the requested dates' });
            }

            const booking = new RentBooking({
                property: propertyId,
                tenant: req.user.id,
                owner: property.owner,
                startDate,
                endDate,
                monthlyRent,
                securityDeposit,
                status: 'PENDING_APPROVAL'
            });

            await booking.save();
            res.status(201).json(booking);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Create PG booking
    async createPgBooking(req, res) {
        try {
            const { bedId, startDate, endDate, monthlyRent, securityDeposit } = req.body;
            const bed = await PgBed.findById(bedId).populate({
                path: 'room',
                populate: { path: 'property' }
            });
            if (!bed) return res.status(404).json({ message: 'Bed not found' });

            if (bed.isOccupied) {
                return res.status(400).json({ message: 'Bed is already occupied' });
            }

            const booking = new PgBooking({
                bed: bedId,
                tenant: req.user.id,
                owner: bed.room.property.owner,
                startDate,
                endDate,
                monthlyRent,
                securityDeposit,
                status: 'PENDING_APPROVAL'
            });

            await booking.save();

            res.status(201).json(booking);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get my bookings
    async getMyBookings(req, res) {
        try {
            const rentBookings = await RentBooking.find({ tenant: req.user.id }).populate('property');
            const pgBookings = await PgBooking.find({ tenant: req.user.id }).populate({
                path: 'bed',
                populate: { path: 'room', populate: { path: 'property' } }
            });

            res.json({ rentBookings, pgBookings });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get owner bookings
    async getOwnerBookings(req, res) {
        try {
            const query = req.user.role === 'ADMIN' ? {} : { owner: req.user.id };
            const rentBookings = await RentBooking.find(query).populate('property tenant');
            const pgBookings = await PgBooking.find(query).populate({
                path: 'bed',
                populate: { path: 'room', populate: { path: 'property' } }
            }).populate('tenant');

            res.json({ rentBookings, pgBookings });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get my payments
    async getMyPayments(req, res) {
        try {
            // This is a bit complex in Mongoose due to nested refs
            // We'll find payments where the linked booking's tenant is the user
            const payments = await MonthlyPayment.find({ status: 'PENDING' })
                .populate({
                    path: 'rentBooking',
                    match: { tenant: req.user.id },
                    populate: { path: 'property' }
                })
                .populate({
                    path: 'pgBooking',
                    match: { tenant: req.user.id },
                    populate: { path: 'bed', populate: { path: 'room', populate: { path: 'property' } } }
                });

            // Filter out payments where match failed
            const myPayments = payments.filter(p => p.rentBooking || p.pgBooking);
            res.json(myPayments);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Pay monthly rent
    async payMonthlyRent(req, res) {
        try {
            const payment = await MonthlyPayment.findById(req.params.paymentId)
                .populate('rentBooking')
                .populate('pgBooking');

            if (!payment) return res.status(404).json({ message: 'Payment not found' });

            // Verify ownership
            const booking = payment.rentBooking || payment.pgBooking;
            if (booking.tenant.toString() !== req.user.id && req.user.role !== 'ADMIN') {
                return res.status(403).json({ message: 'Forbidden' });
            }

            if (payment.status !== 'PENDING') {
                return res.status(400).json({ message: 'Payment is not pending' });
            }

            // Deduct from wallet
            const success = await walletService.deductMoney(
                req.user.id,
                payment.amount,
                'Monthly rent payment',
                `payment_${payment._id}`
            );

            if (!success) {
                return res.status(400).json({ message: 'Insufficient wallet balance' });
            }

            // Update payment
            payment.status = 'PAID';
            payment.paidDate = new Date();
            payment.paymentReference = `wallet_${req.user.id}`;
            await payment.save();

            // Generate next month's payment
            await this.generateMonthlyPayment(payment.rentBooking, payment.pgBooking);

            res.json(payment);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Helper
    async generateMonthlyPayment(rentBooking, pgBooking) {
        const payment = new MonthlyPayment();
        if (rentBooking) {
            payment.rentBooking = rentBooking._id;
            payment.amount = rentBooking.monthlyRent;
            payment.dueDate = await this.findNextDueDate(rentBooking._id, true);
        } else if (pgBooking) {
            payment.pgBooking = pgBooking._id;
            payment.amount = pgBooking.monthlyRent;
            payment.dueDate = await this.findNextDueDate(pgBooking._id, false);
        }
        payment.status = 'PENDING';
        await payment.save();
    }

    async findNextDueDate(bookingId, isRent) {
        const query = isRent ? { rentBooking: bookingId } : { pgBooking: bookingId };
        const latest = await MonthlyPayment.findOne(query).sort({ dueDate: -1 });

        if (!latest) {
            const date = new Date();
            date.setDate(1);
            return date;
        }

        const nextDue = new Date(latest.dueDate);
        nextDue.setMonth(nextDue.getMonth() + 1);
        return nextDue;
    }
}

export default new BookingController();
