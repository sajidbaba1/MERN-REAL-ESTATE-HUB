import User from '../models/User.js';
import bcrypt from 'bcryptjs';

class UserService {
    async createUser(userData) {
        const { email, password } = userData;
        const exists = await User.findOne({ email });
        if (exists) {
            throw new Error('Email already exists');
        }

        // Password hashing is handled by User model pre-save hook
        const user = new User(userData);
        return await user.save();
    }

    async findByEmail(email) {
        return await User.findOne({ email });
    }

    async findById(id) {
        const user = await User.findById(id);
        if (!user) {
            throw new Error('User not found');
        }
        return user;
    }

    async updateUser(id, userDetails) {
        const user = await this.findById(id);

        user.firstName = userDetails.firstName || user.firstName;
        user.lastName = userDetails.lastName || user.lastName;
        user.phoneNumber = userDetails.phoneNumber || user.phoneNumber;

        if (userDetails.password) {
            user.password = userDetails.password; // Model hook will hash this
        }

        return await user.save();
    }

    async existsByEmail(email) {
        const count = await User.countDocuments({ email });
        return count > 0;
    }
}

export default new UserService();
