import RentBooking from '../models/RentBooking.js';
import PgBooking from '../models/PgBooking.js';
import MonthlyPayment from '../models/MonthlyPayment.js';
import Property from '../models/Property.js';
import PgBed from '../models/PgBed.js';
import bookingNotificationService from '../services/bookingNotificationService.js';
import walletService from '../services/walletService.js';
import PropertyInquiry from '../models/PropertyInquiry.js';

class BookingManagementController {
    // Approve rent booking
    async approveRentBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { approvalMessage, finalMonthlyRent, finalSecurityDeposit } = req.body;

            const booking = await RentBooking.findById(bookingId).populate('property owner tenant');
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            if (!this.canManageBooking(req.user, booking.owner._id.toString())) {
                return res.status(403).json({ message: 'Not authorized to manage this booking' });
            }

            if (booking.status !== 'PENDING_APPROVAL') {
                return res.status(400).json({ message: 'Booking is not pending approval' });
            }

            // Verify Document Status from Inquiry
            const inquiry = await PropertyInquiry.findOne({
                property: booking.property._id,
                client: booking.tenant._id,
                status: 'AGREED'
            });

            if (!inquiry || inquiry.documentStatus !== 'APPROVED') {
                return res.status(400).json({ message: 'Documents must be approved via inquiry chat before booking approval' });
            }

            // Deduct from Wallet
            const totalAmount = (booking.securityDeposit || 0) + booking.monthlyRent;
            const deductionSuccess = await walletService.deductMoney(
                booking.tenant._id.toString(),
                totalAmount,
                `Booking Payment for ${booking.property.title}`,
                `booking_${bookingId}`
            );

            if (!deductionSuccess) {
                return res.status(400).json({ message: 'Insufficient tenant wallet balance for initial payment' });
            }

            booking.status = 'ACTIVE';
            booking.isPaid = true;
            booking.approvalDate = new Date();
            if (finalMonthlyRent) booking.monthlyRent = finalMonthlyRent;
            if (finalSecurityDeposit) booking.securityDeposit = finalSecurityDeposit;

            await booking.save();

            // Update property status
            const property = await Property.findById(booking.property._id);
            property.status = 'RENTED';
            await property.save();

            // Generate next monthly payment (first one is now paid)
            // The existing generateMonthlyPayment creates a PENDING one.
            // We should probably mark the first one as PAID or skip it.
            // Generate first monthly payment as PAID (since we just deducted it)
            await this.generateMonthlyPayment(booking, null, 'PAID');

            // Send notification
            await bookingNotificationService.createNotification(
                booking.tenant,
                'BOOKING_APPROVED',
                'Booking Approved',
                `Your booking has been approved${approvalMessage ? ': ' + approvalMessage : ''}`,
                `/bookings/${bookingId}`,
                booking,
                null
            );

            res.json({ booking, message: 'Booking approved successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Approve PG booking
    async approvePgBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { approvalMessage, finalMonthlyRent, finalSecurityDeposit } = req.body;

            const booking = await PgBooking.findById(bookingId).populate('bed owner tenant');
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            if (!this.canManageBooking(req.user, booking.owner._id.toString())) {
                return res.status(403).json({ message: 'Not authorized to manage this booking' });
            }

            if (booking.status !== 'PENDING_APPROVAL') {
                return res.status(400).json({ message: 'Booking is not pending approval' });
            }

            // Verify Document Status from Inquiry
            const inquiry = await PropertyInquiry.findOne({
                property: booking.bed.room.property._id,
                client: booking.tenant._id,
                status: 'AGREED'
            });

            if (!inquiry || inquiry.documentStatus !== 'APPROVED') {
                return res.status(400).json({ message: 'Documents must be approved via inquiry chat before booking approval' });
            }

            // Deduct from Wallet
            const totalAmount = (booking.securityDeposit || 0) + booking.monthlyRent;
            const deductionSuccess = await walletService.deductMoney(
                booking.tenant._id.toString(),
                totalAmount,
                `PG Booking Payment for Bed ${booking.bed.bedNumber}`,
                `pg_booking_${bookingId}`
            );

            if (!deductionSuccess) {
                return res.status(400).json({ message: 'Insufficient tenant wallet balance for initial payment' });
            }

            booking.status = 'ACTIVE';
            booking.isPaid = true;
            booking.approvalDate = new Date();
            if (finalMonthlyRent) booking.monthlyRent = finalMonthlyRent;
            if (finalSecurityDeposit) booking.securityDeposit = finalSecurityDeposit;

            await booking.save();

            // Mark bed as occupied
            const bed = await PgBed.findById(booking.bed._id);
            bed.isOccupied = true;
            await bed.save();

            // Generate first monthly payment as PAID
            await this.generateMonthlyPayment(null, booking, 'PAID');

            // Send notification
            await bookingNotificationService.createNotification(
                booking.tenant,
                'BOOKING_APPROVED',
                'PG Booking Approved',
                `Your PG booking has been approved${approvalMessage ? ': ' + approvalMessage : ''}`,
                `/bookings/${bookingId}`,
                null,
                booking
            );

            res.json({ booking, message: 'PG booking approved successfully' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Reject rent booking
    async rejectRentBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { rejectionReason } = req.body;

            const booking = await RentBooking.findById(bookingId).populate('owner tenant');
            if (!booking) return res.status(404).json({ message: 'Booking not found' });

            if (!this.canManageBooking(req.user, booking.owner._id.toString())) {
                return res.status(403).json({ message: 'Not authorized to manage this booking' });
            }

            if (booking.status !== 'PENDING_APPROVAL') {
                return res.status(400).json({ message: 'Booking is not pending approval' });
            }

            booking.status = 'REJECTED';
            booking.rejectionReason = rejectionReason;
            await booking.save();

            // Send notification
            await bookingNotificationService.createNotification(
                booking.tenant,
                'BOOKING_REJECTED',
                'Booking Rejected',
                `Your booking has been rejected${rejectionReason ? ': ' + rejectionReason : ''}`,
                `/bookings/${bookingId}`,
                booking,
                null
            );

            res.json({ booking, message: 'Booking rejected' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Cancel booking
    async cancelBooking(req, res) {
        try {
            const { bookingId } = req.params;
            const { cancellationReason, refundDeposit } = req.body;

            // Try rent booking first
            let rentBooking = await RentBooking.findById(bookingId).populate('property tenant owner');
            if (rentBooking) {
                if (!this.canCancelBooking(req.user, rentBooking.tenant._id.toString(), rentBooking.owner._id.toString())) {
                    return res.status(403).json({ message: 'Not authorized to cancel this booking' });
                }

                rentBooking.status = 'CANCELLED';
                rentBooking.cancellationReason = cancellationReason;
                await rentBooking.save();

                // Update property status
                const property = await Property.findById(rentBooking.property._id);
                property.status = 'FOR_RENT';
                await property.save();

                // Handle deposit refund
                if (refundDeposit && rentBooking.securityDeposit) {
                    await walletService.addMoney(
                        rentBooking.tenant._id.toString(),
                        rentBooking.securityDeposit,
                        'Security deposit refund for cancelled booking',
                        `refund_${bookingId}`
                    );
                }

                return res.json({ message: 'Rent booking cancelled successfully' });
            }

            // Try PG booking
            let pgBooking = await PgBooking.findById(bookingId).populate('bed tenant owner');
            if (pgBooking) {
                if (!this.canCancelBooking(req.user, pgBooking.tenant._id.toString(), pgBooking.owner._id.toString())) {
                    return res.status(403).json({ message: 'Not authorized to cancel this booking' });
                }

                pgBooking.status = 'CANCELLED';
                pgBooking.cancellationReason = cancellationReason;
                await pgBooking.save();

                // Mark bed as available
                const bed = await PgBed.findById(pgBooking.bed._id);
                bed.isOccupied = false;
                await bed.save();

                // Handle deposit refund
                if (refundDeposit && pgBooking.securityDeposit) {
                    await walletService.addMoney(
                        pgBooking.tenant._id.toString(),
                        pgBooking.securityDeposit,
                        'Security deposit refund for cancelled PG booking',
                        `refund_${bookingId}`
                    );
                }

                return res.json({ message: 'PG booking cancelled successfully' });
            }

            res.status(404).json({ message: 'Booking not found' });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Get pending approvals
    async getPendingApprovals(req, res) {
        try {
            const page = parseInt(req.query.page) || 0;
            const size = parseInt(req.query.size) || 10;

            const isAdmin = req.user.role === 'ADMIN';
            const query = isAdmin ? {} : { owner: req.user.id };

            const pendingRentBookings = await RentBooking.find({ ...query, status: 'PENDING_APPROVAL' })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size)
                .populate('property tenant owner');

            const pendingPgBookings = await PgBooking.find({ ...query, status: 'PENDING_APPROVAL' })
                .sort({ createdAt: -1 })
                .skip(page * size)
                .limit(size)
                .populate('bed tenant owner');

            res.json({
                rentBookings: pendingRentBookings,
                pgBookings: pendingPgBookings,
                totalPending: pendingRentBookings.length + pendingPgBookings.length
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    // Helper methods
    canManageBooking(currentUser, bookingOwnerId) {
        return currentUser.role === 'ADMIN' || currentUser.id === bookingOwnerId;
    }

    canCancelBooking(currentUser, tenantId, ownerId) {
        return currentUser.role === 'ADMIN' || currentUser.id === tenantId || currentUser.id === ownerId;
    }

    async generateMonthlyPayment(rentBooking, pgBooking, status = 'PENDING') {
        const payment = new MonthlyPayment({
            rentBooking: rentBooking?._id,
            pgBooking: pgBooking?._id,
            amount: rentBooking ? rentBooking.monthlyRent : pgBooking.monthlyRent,
            dueDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), // Due for NEXT month
            status
        });

        await payment.save();
    }
}

export default new BookingManagementController();
