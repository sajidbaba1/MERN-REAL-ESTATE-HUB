import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { createServer } from 'http';
import { Server } from 'socket.io';
import connectDB from './config/database.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const httpServer = createServer(app);

// Initialize Socket.IO
const io = new Server(httpServer, {
    cors: {
        origin: process.env.CORS_ORIGIN.split(','),
        credentials: true
    }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(helmet());
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS configuration
const corsOptions = {
    origin: process.env.CORS_ORIGIN.split(','),
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// API Routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import propertyRoutes from './routes/property.routes.js';
import walletRoutes from './routes/wallet.routes.js';
import bookingRoutes from './routes/booking.routes.js';
import pgRoutes from './routes/pg.routes.js';
import leadRoutes from './routes/lead.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import ragRoutes from './routes/rag.routes.js';
import paymentRoutes from './routes/payment.routes.js';
import inquiryRoutes from './routes/inquiry.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import locationRoutes from './routes/location.routes.js';
import agentRoutes from './routes/agent.routes.js';
import adminRoutes from './routes/admin.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import systemRoutes from './routes/system.routes.js';
import otpRoutes from './routes/otp.routes.js';
import reviewRoutes from './routes/review.routes.js';
import bookingNotificationRoutes from './routes/bookingNotification.routes.js';
import bookingAnalyticsRoutes from './routes/bookingAnalytics.routes.js';
import bookingManagementRoutes from './routes/bookingManagement.routes.js';
// ... more routes

app.use('/api/auth', authRoutes);
app.use('/api/auth/otp', otpRoutes);
app.use('/api/users', userRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pg', pgRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/rag', ragRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/inquiries', inquiryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/booking-notifications', bookingNotificationRoutes);
app.use('/api/booking-analytics', bookingAnalyticsRoutes);
app.use('/api/booking-management', bookingManagementRoutes);
// ... more route registrations

// Temporary test route
app.get('/api/test', (req, res) => {
    res.json({ message: 'Backend is running!', env: process.env.NODE_ENV });
});

// Socket.IO connection handling

// Socket.IO connection handling
import { initializeSocket } from './socket/socketManager.js';
initializeSocket(io);


// Make io accessible to routes
app.set('io', io);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 8888;
httpServer.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   🏠 Real Estate Backend (Node.js + MongoDB)            ║
║                                                          ║
║   Server running on: http://localhost:${PORT}              ║
║   Environment: ${process.env.NODE_ENV}                            ║
║   Database: MongoDB Atlas                                ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
  `);
});

export default app;
