import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';

dotenv.config();

async function checkUsers() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({});
        console.log('All users:');
        users.forEach(u => {
            console.log(`ID: ${u._id}, Name: ${u.firstName} ${u.lastName}, Role: ${u.role}, Email: ${u.email}`);
        });
        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}
checkUsers();
