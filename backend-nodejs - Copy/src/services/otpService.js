import OtpToken from '../models/OtpToken.js';
import User from '../models/User.js';
import { transporter } from './mailService.js';
import dotenv from 'dotenv';

dotenv.config();

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;
const RATE_LIMIT_MINUTES = 5;
const MAX_OTPS_PER_PERIOD = 3;

class OtpService {
    constructor() {
        this.transporter = transporter;
    }

    async sendOtp(email) {
        try {
            const user = await User.findOne({ email });
            if (!user) {
                throw new Error('User not found with email: ' + email);
            }

            // Rate limiting
            const rateLimitTime = new Date(Date.now() - RATE_LIMIT_MINUTES * 60000);
            const recentOtpCount = await OtpToken.countDocuments({
                email,
                createdAt: { $gte: rateLimitTime }
            });

            if (recentOtpCount >= MAX_OTPS_PER_PERIOD) {
                throw new Error(`Too many OTP requests. Please wait ${RATE_LIMIT_MINUTES} minutes before requesting again.`);
            }

            // Generate OTP
            const otpCode = this.generateOtp();
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60000);

            // Save to DB
            const otpToken = new OtpToken({
                email,
                otpCode,
                expiresAt
            });
            await otpToken.save();

            // Send Email
            await this.sendOtpEmail(email, otpCode, `${user.firstName} ${user.lastName}`);

            // Cleanup expired
            this.cleanupExpiredOtps();

            return true;
        } catch (error) {
            console.error('Error sending OTP:', error);
            throw error;
        }
    }

    async verifyOtp(email, otpCode) {
        try {
            const otpToken = await OtpToken.findOne({
                email,
                otpCode,
                used: false
            });

            if (!otpToken) return false;

            if (otpToken.expiresAt < new Date() || otpToken.attempts >= MAX_OTP_ATTEMPTS) {
                return false;
            }

            otpToken.attempts += 1;

            if (otpToken.otpCode !== otpCode) {
                await otpToken.save();
                return false;
            }

            otpToken.used = true;
            await otpToken.save();

            // Delete all OTPs for this email after successful verification
            await OtpToken.deleteMany({ email });

            return true;
        } catch (error) {
            console.error('Error verifying OTP:', error);
            return false;
        }
    }

    generateOtp() {
        let otp = '';
        for (let i = 0; i < OTP_LENGTH; i++) {
            otp += Math.floor(Math.random() * 10);
        }
        return otp;
    }

    async sendOtpEmail(email, otpCode, userName) {
        const mailOptions = {
            from: `"event" <${process.env.SMTP_USERNAME}>`,
            to: email,
            subject: 'Your event Login OTP',
            text: `Dear ${userName},\n\n` +
                `Your One-Time Password (OTP) for event login is: ${otpCode}\n\n` +
                `This OTP is valid for ${OTP_EXPIRY_MINUTES} minutes only.\n\n` +
                `If you didn't request this OTP, please ignore this email.\n\n` +
                `Best regards,\n` +
                `event Team`
        };

        const result = await this.transporter.sendMail(mailOptions);
        console.log('OTP Email send result:', result.messageId);
        return result;
    }

    async cleanupExpiredOtps() {
        try {
            await OtpToken.deleteMany({
                $or: [
                    { expiresAt: { $lt: new Date() } },
                    { used: true }
                ]
            });
        } catch (error) {
            console.error('Error cleaning up expired OTPs:', error);
        }
    }

    async hasValidOtp(email) {
        try {
            const otpToken = await OtpToken.findOne({
                email,
                used: false,
                expiresAt: { $gt: new Date() }
            });
            return !!otpToken;
        } catch (error) {
            console.error('Error checking OTP validity:', error);
            return false;
        }
    }

    async getRemainingTimeMinutes(email) {
        try {
            const otpToken = await OtpToken.findOne({
                email,
                used: false,
                expiresAt: { $gt: new Date() }
            }).sort({ expiresAt: -1 });

            if (!otpToken) return 0;

            const remaining = Math.max(0, Math.floor((otpToken.expiresAt - new Date()) / 60000));
            return remaining;
        } catch (error) {
            console.error('Error getting remaining time:', error);
            return 0;
        }
    }
}

export default new OtpService();
