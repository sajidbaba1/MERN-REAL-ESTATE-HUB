import Property from '../models/Property.js';
import PropertyInquiry from '../models/PropertyInquiry.js';
import walletService from '../services/walletService.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

class PaymentController {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }

    async createOrder(req, res) {
        try {
            const { inquiryId, amount } = req.body;
            const inquiry = await PropertyInquiry.findById(inquiryId);
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });
            if (inquiry.status !== 'AGREED') {
                return res.status(400).json({ message: 'Deal is not agreed yet' });
            }

            const amountInInr = (amount && amount > 0) ? amount : 10000;
            const options = {
                amount: amountInInr * 100, // paise
                currency: 'INR',
                receipt: `inq_${inquiryId}`,
                payment_capture: 1
            };

            const order = await this.razorpay.orders.create(options);
            res.json({
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.RAZORPAY_KEY_ID,
                inquiryId
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async verifyPayment(req, res) {
        try {
            const { inquiryId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

            const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
            hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
            const generated_signature = hmac.digest('hex');

            if (generated_signature !== razorpay_signature) {
                return res.status(400).json({ message: 'Invalid signature' });
            }

            const inquiry = await PropertyInquiry.findById(inquiryId).populate('property');
            if (!inquiry) return res.status(404).json({ message: 'Inquiry not found' });

            inquiry.status = 'PURCHASED';
            await inquiry.save();

            const property = inquiry.property;
            property.status = 'SOLD';
            await property.save();

            // Deduct from wallet record (optional as per reference)
            try {
                await walletService.deductMoney(
                    req.user.id,
                    10000,
                    `Token payment for property booking - Inquiry #${inquiryId}`,
                    razorpay_payment_id
                );
            } catch (err) {
                console.error('Wallet deduction failed but continuing:', err.message);
            }

            res.json({
                status: 'success',
                inquiryId: inquiry._id,
                propertyId: property._id,
                dealStatus: inquiry.status
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new PaymentController();
