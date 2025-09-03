const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '24h';

// Generate JWT Token
const generateToken = (userId) => {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRE });
};

// Middleware to protect routes
const protect = async (req, res, next) => {
    try {
        let token;

        // Check for token in cookies first, then header
        if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).render('auth/login', {
                title: 'Login Required',
                error: 'Please log in to access this page'
            });
        }

        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Get user from token
        const user = await User.findById(decoded.userId);
        
        if (!user || !user.isActive) {
            return res.status(401).render('auth/login', {
                title: 'Login Required',
                error: 'User account is not active'
            });
        }

        req.user = user;
        res.locals.user = user; // Make user available in templates
        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(401).render('auth/login', {
            title: 'Login Required',
            error: 'Invalid token. Please log in again.'
        });
    }
};

// Middleware to check if user is admin
const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        return res.status(403).render('error', {
            title: 'Access Denied',
            error: {
                status: 403,
                message: 'Admin access required'
            }
        });
    }
};

// Middleware to redirect if already authenticated
const redirectIfAuthenticated = (req, res, next) => {
    let token;
    
    if (req.cookies && req.cookies.token) {
        token = req.cookies.token;
    }
    
    if (token) {
        try {
            jwt.verify(token, JWT_SECRET);
            return res.redirect('/');
        } catch (error) {
            // Token is invalid, continue to login
        }
    }
    
    next();
};


module.exports = {
    generateToken,
    protect,
    adminOnly,
    redirectIfAuthenticated,
    JWT_SECRET
};