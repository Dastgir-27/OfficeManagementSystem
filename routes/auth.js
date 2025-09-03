const express = require('express');
const User = require('../models/User');
const { generateToken, redirectIfAuthenticated } = require('../middleware/auth');

const router = express.Router();

// GET /auth/login - Show login form
router.get('/login', redirectIfAuthenticated, (req, res) => {
    res.render('auth/login', {
        title: 'Admin Login',
        error: null
    });
});

// POST /auth/login - Process login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.render('auth/login', {
                title: 'Admin Login',
                error: 'Please provide email and password'
            });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user || !await user.comparePassword(password)) {
            return res.render('auth/login', {
                title: 'Admin Login',
                error: 'Invalid email or password'
            });
        }

        if (!user.isActive) {
            return res.render('auth/login', {
                title: 'Admin Login',
                error: 'Account is deactivated. Contact administrator.'
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token
        const token = generateToken(user._id);

        // Set cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000 // 24 hours
        });

        res.redirect('/');
    } catch (error) {
        console.error('Login error:', error);
        res.render('auth/login', {
            title: 'Admin Login',
            error: 'An error occurred during login'
        });
    }
});

// GET /auth/register - Show registration form (for initial setup)
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Admin Registration',
        error: null,
        success: null
    });
});

// POST /auth/register - Process registration
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, confirmPassword, firstName, lastName } = req.body;

        // Validate input
        if (!username || !email || !password || !confirmPassword || !firstName || !lastName) {
            return res.render('auth/register', {
                title: 'Admin Registration',
                error: 'All fields are required',
                success: null
            });
        }

        if (password !== confirmPassword) {
            return res.render('auth/register', {
                title: 'Admin Registration',
                error: 'Passwords do not match',
                success: null
            });
        }

        if (password.length < 6) {
            return res.render('auth/register', {
                title: 'Admin Registration',
                error: 'Password must be at least 6 characters long',
                success: null
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: username.toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.render('auth/register', {
                title: 'Admin Registration',
                error: 'User with this email or username already exists',
                success: null
            });
        }

        // Create new user
        const user = new User({
            username: username.toLowerCase(),
            email: email.toLowerCase(),
            password,
            firstName,
            lastName,
            role: 'admin'
        });

        await user.save();

        res.render('auth/register', {
            title: 'Admin Registration',
            error: null,
            success: 'Admin account created successfully! You can now login.'
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.render('auth/register', {
            title: 'Admin Registration',
            error: 'An error occurred during registration',
            success: null
        });
    }
});

// POST /auth/logout - Logout
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

// GET /auth/logout - Logout (for GET requests)
router.get('/logout', (req, res) => {
    res.clearCookie('token');
    res.redirect('/auth/login');
});

module.exports = router;