import otpService from '../services/otpService.js';

class OtpController {
    async sendOtp(req, res) {
        try {
            const { email } = req.body;

            if (!email || !email.trim()) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            // Validate email format
            const emailRegex = /^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({ success: false, message: 'Invalid email format' });
            }

            const sent = await otpService.sendOtp(email.trim().toLowerCase());

            if (sent) {
                res.json({
                    success: true,
                    message: 'OTP sent successfully to your email',
                    expiryMinutes: 10
                });
            } else {
                res.json({ success: false, message: 'Failed to send OTP' });
            }
        } catch (error) {
            res.status(400).json({ success: false, message: error.message });
        }
    }

    async verifyOtp(req, res) {
        try {
            const { email, otpCode } = req.body;

            if (!email || !email.trim()) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            if (!otpCode || !otpCode.trim()) {
                return res.status(400).json({ success: false, message: 'OTP code is required' });
            }

            // Validate OTP format (6 digits)
            if (!/^\d{6}$/.test(otpCode)) {
                return res.status(400).json({ success: false, message: 'OTP must be 6 digits' });
            }

            const verified = await otpService.verifyOtp(email.trim().toLowerCase(), otpCode.trim());

            if (verified) {
                res.json({ success: true, message: 'OTP verified successfully' });
            } else {
                res.json({ success: false, message: 'Invalid or expired OTP' });
            }
        } catch (error) {
            res.status(400).json({ success: false, message: `OTP verification failed: ${error.message}` });
        }
    }

    async getOtpStatus(req, res) {
        try {
            const { email } = req.query;

            if (!email || !email.trim()) {
                return res.status(400).json({ success: false, message: 'Email is required' });
            }

            const hasValidOtp = await otpService.hasValidOtp(email.trim().toLowerCase());
            const remainingMinutes = await otpService.getRemainingTimeMinutes(email.trim().toLowerCase());

            res.json({
                success: true,
                hasValidOtp,
                remainingMinutes
            });
        } catch (error) {
            res.status(400).json({ success: false, message: `Failed to get OTP status: ${error.message}` });
        }
    }
}

export default new OtpController();
