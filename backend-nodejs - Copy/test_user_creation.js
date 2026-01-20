import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

async function testUserCreation() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        // Clean up test user if exists
        await User.deleteOne({ email: 'testuser@example.com' });

        // Create a test user the same way the admin controller does
        const testUser = new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'testuser@example.com',
            password: 'TestPassword123',
            role: 'USER',
            enabled: true
        });

        await testUser.save();
        console.log('✓ User created successfully');

        // Now fetch the user and check the password
        const savedUser = await User.findOne({ email: 'testuser@example.com' }).select('+password');
        console.log('\nUser details:');
        console.log('Email:', savedUser.email);
        console.log('Password hash:', savedUser.password);
        console.log('Password hash length:', savedUser.password.length);

        // Test password comparison
        const isMatch = await savedUser.comparePassword('TestPassword123');
        console.log('\nPassword comparison test:');
        console.log('Correct password matches:', isMatch);

        const isWrongMatch = await savedUser.comparePassword('WrongPassword');
        console.log('Wrong password matches:', isWrongMatch);

        // Also test bcrypt.compare directly
        const directMatch = await bcrypt.compare('TestPassword123', savedUser.password);
        console.log('Direct bcrypt.compare:', directMatch);

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
        await mongoose.disconnect();
    }
}

testUserCreation();
