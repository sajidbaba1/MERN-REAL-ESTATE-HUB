import User from '../models/User.js';
import { generateToken } from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, phoneNumber } = req.body;

        // Check if user exists
        const userExists = await User.findOne({ email: email.toLowerCase() });
        if (userExists) {
            return res.status(400).json({ message: 'Email is already taken!' });
        }

        // Create user
        const user = await User.create({
            firstName,
            lastName,
            email: email.toLowerCase(),
            password,
            phoneNumber
        });

        // Generate token
        const token = generateToken(user);

        res.status(201).json({
            token,
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(400).json({ message: `Error: ${error.message}` });
    }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user and include password
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            console.log(`Login attempt failed: User not found with email ${email}`);
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`Login attempt failed: Password mismatch for ${email}`);
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Check if user is enabled
        if (!user.enabled) {
            console.log(`Login attempt failed: Account disabled for ${email}`);
            return res.status(400).json({ message: 'User account is disabled' });
        }

        // Generate token
        console.log('Generating token for User:', user.email, 'ID:', user._id, 'Role:', user.role);
        const token = generateToken(user);
        console.log('Generated Token preview:', token.substring(0, 20) + '...');

        res.json({
            token,
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Login error details:', error);
        res.status(400).json({ message: 'Login failed: ' + error.message });
    }
};

// @desc    Login with OTP
// @route   POST /api/auth/login-otp
// @access  Public
export const loginWithOtp = async (req, res) => {
    try {
        const { email, otpCode } = req.body;

        if (!email || !otpCode || !otpCode.match(/^\d{6}$/)) {
            return res.status(400).json({ message: 'Email and 6-digit otpCode are required' });
        }

        // Verify OTP (you'll need to implement OTP service)
        // const isValid = await otpService.verifyOtp(email.toLowerCase(), otpCode);
        // if (!isValid) {
        //   return res.status(400).json({ message: 'Invalid or expired OTP' });
        // }

        // Find user
        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        // Generate token
        const token = generateToken(user);

        res.json({
            token,
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('OTP login error:', error);
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            role: user.role,
            enabled: user.enabled,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(400).json({ message: error.message });
    }
};
