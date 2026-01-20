import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Token decoded FULL:', JSON.stringify(decoded));

            const userId = decoded.id || decoded.sub;
            const userEmail = decoded.email || (decoded.sub && decoded.sub.includes('@') ? decoded.sub : null);

            // Get user from token
            if (userId && userId.length === 24) { // Likely MongoDB ObjectId
                req.user = await User.findById(userId).select('-password');
            } else if (userEmail) {
                req.user = await User.findOne({ email: userEmail.toLowerCase() }).select('-password');
            }

            if (!req.user) {
                console.log('AUTH FAILED: User not found in DB for ID/Email:', userId, userEmail);
                return res.status(401).json({ message: 'User not found' });
            }

            if (!req.user.enabled) {
                console.log('AUTH FAILED: User account disabled:', req.user.email);
                return res.status(401).json({ message: 'User account is disabled' });
            }

            next();
        } catch (error) {
            console.error('AUTH ERROR (jwt.verify):', error.message);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        // console.log('AUTH FAILED: No token provided in header');
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role '${req.user.role}' is not authorized to access this route`
            });
        }

        next();
    };
};
