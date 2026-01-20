import Wallet from '../models/Wallet.js';
import WalletTransaction from '../models/WalletTransaction.js';
import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

class WalletService {
    constructor() {
        this.razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET
        });
    }

    async getOrCreateWallet(userId) {
        let wallet = await Wallet.findOne({ user: userId });
        if (!wallet) {
            wallet = new Wallet({ user: userId, balance: 0 });
            await wallet.save();
        }
        return wallet;
    }

    async createRazorpayOrder(amount, description) {
        const options = {
            amount: amount * 100, // paise
            currency: 'INR',
            receipt: `wallet_${Date.now()}`,
            payment_capture: 1
        };
        const order = await this.razorpay.orders.create(options);
        return {
            orderId: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        };
    }

    async verifyPayment(userId, paymentData) {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount, description } = paymentData;

        const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
        hmac.update(razorpay_order_id + "|" + razorpay_payment_id);
        const generated_signature = hmac.digest('hex');

        if (generated_signature !== razorpay_signature) {
            throw new Error('Invalid signature');
        }

        const wallet = await this.getOrCreateWallet(userId);
        const numAmount = Number(amount);

        const transaction = new WalletTransaction({
            wallet: wallet._id,
            type: 'CREDIT',
            amount: numAmount,
            description: description || 'Wallet top-up via Razorpay',
            referenceId: razorpay_payment_id
        });
        await transaction.save();

        wallet.balance += numAmount;
        await wallet.save();

        return {
            walletId: wallet._id,
            newBalance: wallet.balance,
            transactionId: transaction._id
        };
    }

    async addMoney(userId, amount, description, referenceId = null) {
        const wallet = await this.getOrCreateWallet(userId);
        const numAmount = Number(amount);

        const transaction = new WalletTransaction({
            wallet: wallet._id,
            type: 'CREDIT',
            amount: numAmount,
            description: description || 'Money added to wallet',
            referenceId
        });
        await transaction.save();

        wallet.balance += numAmount;
        await wallet.save();

        return {
            walletId: wallet._id,
            newBalance: wallet.balance,
            transactionId: transaction._id
        };
    }

    async deductMoney(userId, amount, description, referenceId = null) {
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) throw new Error('Wallet not found');

        const numAmount = Number(amount);
        if (wallet.balance < numAmount) return false;

        const transaction = new WalletTransaction({
            wallet: wallet._id,
            type: 'DEBIT',
            amount: numAmount,
            description: description || 'Money deducted from wallet',
            referenceId
        });
        await transaction.save();

        wallet.balance -= numAmount;
        await wallet.save();

        return true;
    }

    async getTransactions(userId) {
        const wallet = await Wallet.findOne({ user: userId });
        if (!wallet) return [];
        return await WalletTransaction.find({ wallet: wallet._id }).sort({ createdAt: -1 });
    }
}

export default new WalletService();
