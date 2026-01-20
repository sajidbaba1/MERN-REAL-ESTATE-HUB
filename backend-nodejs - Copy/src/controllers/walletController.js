import walletService from '../services/walletService.js';

class WalletController {
    async getMyWallet(req, res) {
        try {
            const wallet = await walletService.getOrCreateWallet(req.user.id);
            res.json({
                id: wallet._id,
                balance: wallet.balance,
                userId: req.user.id
            });
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createWalletOrder(req, res) {
        try {
            const { amount, description } = req.body;
            const order = await walletService.createRazorpayOrder(amount, description);
            res.json(order);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async verifyWalletPayment(req, res) {
        try {
            const result = await walletService.verifyPayment(req.user.id, req.body);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getMyTransactions(req, res) {
        try {
            const transactions = await walletService.getTransactions(req.user.id);
            res.json(transactions);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async addMoney(req, res) {
        try {
            const { amount, description } = req.body;
            const result = await walletService.addMoney(req.user.id, amount, description);
            res.json(result);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new WalletController();
