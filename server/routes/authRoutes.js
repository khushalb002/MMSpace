const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const Admin = require('../models/Admin');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const { auth, blacklistToken } = require('../middleware/auth');
const Guardian = require('../models/Guardian');

const router = express.Router();

// Very lenient rate limiting for development
const authLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute window
    max: 100, // 100 attempts per minute (very lenient for development)
    message: { message: 'Too many login attempts, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
    skip: (req) => {
        // Skip rate limiting in development
        return process.env.NODE_ENV === 'development';
    }
});

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Register user
// @access  Public
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('role').isIn(['admin', 'mentor', 'mentee', 'guardian']),
    body('fullName').notEmpty().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role, fullName, ...profileData } = req.body;

        // Check if user exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create user
        user = new User({ email, password, role });
        await user.save();

        // Create profile based on role
        if (role === 'admin') {
            const admin = new Admin({
                userId: user._id,
                fullName,
                employeeId: profileData.employeeId || `ADM${Date.now()}`,
                department: profileData.department || 'Administration',
                phone: profileData.phone || '',
                position: profileData.position || 'System Administrator'
            });
            await admin.save();
        } else if (role === 'mentor') {
            const mentor = new Mentor({
                userId: user._id,
                fullName,
                employeeId: profileData.employeeId || `EMP${Date.now()}`,
                department: profileData.department || 'General',
                phone: profileData.phone || '',
                subjects: profileData.subjects || []
            });
            await mentor.save();
        } else if (role === 'mentee') {
            // For mentees, we'll assign them to the first available mentor for now
            // In a real system, this would be handled by an admin
            const firstMentor = await Mentor.findOne();

            const mentee = new Mentee({
                userId: user._id,
                mentorId: firstMentor ? firstMentor._id : null,
                fullName,
                studentId: profileData.studentId || `STU${Date.now()}`,
                phone: profileData.phone || '',
                class: profileData.class || '',
                section: profileData.section || '',
                academicYear: profileData.academicYear || new Date().getFullYear().toString()
            });
            await mentee.save();
        } else {
            // Guardian registration - link to existing mentee
            const studentId = (profileData.studentId || '').trim();

            if (!studentId) {
                return res.status(400).json({ message: 'Student ID is required for guardian registration' });
            }

            const mentee = await Mentee.findOne({ studentId });

            if (!mentee) {
                return res.status(404).json({ message: 'No mentee found with the provided student ID' });
            }

            const guardian = new Guardian({
                userId: user._id,
                fullName,
                phone: (profileData.phone || '').trim(),
                relationship: (profileData.relationship || 'Parent').trim(),
                menteeIds: [mentee._id]
            });

            await guardian.save();

            mentee.guardianIds = Array.from(new Set([...(mentee.guardianIds || []), guardian._id]));
            await mentee.save();
        }

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', authLimiter, [
    body('email').isEmail().normalizeEmail(),
    body('password').exists()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Login validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log(`Login attempt for email: ${email}`);

        // Add retry logic for database operations
        let user;
        let retries = 3;

        while (retries > 0) {
            try {
                user = await User.findOne({ email });
                break;
            } catch (dbError) {
                retries--;
                if (retries === 0) {
                    console.error('Database error during login:', dbError);
                    return res.status(500).json({ message: 'Database connection error. Please try again.' });
                }
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        }

        if (!user) {
            console.log(`Login failed: User not found for email: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.isActive) {
            console.log(`Login failed: User account is inactive for email: ${email}`);
            return res.status(400).json({ message: 'Account is inactive' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            console.log(`Login failed: Invalid password for email: ${email}`);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Update last login with retry mechanism
        retries = 3;
        while (retries > 0) {
            try {
                await User.findByIdAndUpdate(user._id, {
                    lastLogin: new Date()
                }, { new: true });
                break;
            } catch (saveError) {
                retries--;
                if (retries === 0) {
                    console.error('Error updating last login:', saveError);
                    // Don't fail the login if we can't update lastLogin
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        const token = generateToken(user._id);
        console.log(`Login successful for email: ${email}`);

        res.json({
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', auth, async (req, res) => {
    try {
        let profile;
        let retries = 3;

        while (retries > 0) {
            try {
                if (req.user.role === 'admin') {
                    profile = await Admin.findOne({ userId: req.user._id }).lean();
                } else if (req.user.role === 'mentor') {
                    profile = await Mentor.findOne({ userId: req.user._id }).lean();
                } else if (req.user.role === 'guardian') {
                    profile = await Guardian.findOne({ userId: req.user._id })
                        .populate({
                            path: 'menteeIds',
                            select: 'fullName studentId class section mentorId attendance guardianIds',
                            populate: {
                                path: 'mentorId',
                                select: 'fullName department phone'
                            }
                        })
                        .lean();
                } else {
                    profile = await Mentee.findOne({ userId: req.user._id })
                        .populate('mentorId', 'fullName department phone')
                        .lean();
                }
                break;
            } catch (dbError) {
                retries--;
                if (retries === 0) {
                    console.error('Database error in /me route:', dbError);
                    return res.status(500).json({ message: 'Database connection error' });
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        res.json({
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role
            },
            profile
        });
    } catch (error) {
        console.error('Error in /me route:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/auth/logout
// @desc    Logout user (blacklist token)
// @access  Private
router.post('/logout', auth, async (req, res) => {
    try {
        // Blacklist the current token
        blacklistToken(req.token);

        res.json({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ message: 'Server error during logout' });
    }
});

// @route   POST /api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', auth, async (req, res) => {
    try {
        // Generate new token
        const newToken = generateToken(req.user._id);

        // Blacklist old token
        blacklistToken(req.token);

        res.json({
            token: newToken,
            user: {
                id: req.user._id,
                email: req.user.email,
                role: req.user.role
            }
        });
    } catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ message: 'Server error during token refresh' });
    }
});

module.exports = router;