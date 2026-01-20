import User from '../models/User.js';
import bcrypt from 'bcryptjs';

class AdminController {
    // Users
    async getAllUsers(req, res) {
        try {
            const users = await User.find().select('-password').sort({ createdAt: -1 });
            res.json(users);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async getUserById(req, res) {
        try {
            const user = await User.findById(req.params.id).select('-password');
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async createUser(req, res) {
        try {
            const { firstName, lastName, email, password, role } = req.body;
            const existing = await User.findOne({ email });
            if (existing) return res.status(409).json({ message: 'Email already exists' });

            const user = new User({
                firstName,
                lastName,
                email,
                password,
                role: role || 'USER',
                enabled: true
            });

            const saved = await user.save();
            const userObj = saved.toObject();
            delete userObj.password;
            res.status(201).json(userObj);
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    }

    async updateUser(req, res) {
        try {
            const { firstName, lastName, email, password, role, enabled } = req.body;
            const user = await User.findById(req.params.id).select('+password');
            if (!user) return res.status(404).json({ message: 'User not found' });

            if (firstName) user.firstName = firstName;
            if (lastName) user.lastName = lastName;
            if (email) user.email = email;
            if (role) user.role = role;
            if (enabled !== undefined) user.enabled = enabled;

            if (password) {
                user.password = password;
            }

            const saved = await user.save();
            const userObj = saved.toObject();
            delete userObj.password;
            res.json(userObj);
        } catch (error) {
            console.error('Update User Error:', error);
            res.status(400).json({ message: error.message });
        }
    }

    async deleteUser(req, res) {
        try {
            const user = await User.findById(req.params.id);
            if (!user) return res.status(404).json({ message: 'User not found' });
            await User.findByIdAndDelete(req.params.id);
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async toggleUserStatus(req, res) {
        try {
            const { enabled } = req.body;
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { enabled },
                { new: true }
            ).select('-password');
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }

    async updateUserRole(req, res) {
        try {
            const { role } = req.body;
            const user = await User.findByIdAndUpdate(
                req.params.id,
                { role },
                { new: true }
            ).select('-password');
            if (!user) return res.status(404).json({ message: 'User not found' });
            res.json(user);
        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    }
}

export default new AdminController();
