const express = require('express');
const Grievance = require('../models/Grievance');
const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { safeFindOne, safeFind, safeSave, safeUpdate, executeWithRetry } = require('../utils/dbUtils');

const router = express.Router();

// @route   POST /api/grievances
// @desc    Submit grievance
// @access  Private (Mentee only)
router.post('/', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        const mentee = await safeFindOne(Mentee, { userId: req.user._id });

        if (!mentee) {
            return res.status(404).json({ message: 'Mentee profile not found' });
        }

        const { 
            name, 
            email, 
            rollNo, 
            subject, 
            grievanceType, 
            description, 
            dateOfIncident 
        } = req.body;

        const grievance = new Grievance({
            menteeId: mentee._id,
            mentorId: mentee.mentorId,
            name,
            email,
            rollNo,
            subject,
            grievanceType,
            description,
            dateOfIncident
        });

        const savedGrievance = await safeSave(grievance);

        // Populate the saved grievance
        const populatedGrievance = await executeWithRetry(async () => {
            return Grievance.findById(savedGrievance._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentor
        if (mentee.mentorId) {
            req.io.to(mentee.mentorId.toString()).emit('newGrievance', populatedGrievance);
        }

        res.status(201).json(populatedGrievance);
    } catch (error) {
        console.error('Error creating grievance:', error);
        res.status(500).json({ message: 'Failed to create grievance' });
    }
});

// @route   GET /api/grievances/mentee
// @desc    Get mentee's grievances
// @access  Private (Mentee only)
router.get('/mentee', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        console.log('Fetching grievances for mentee user:', req.user._id);

        const mentee = await safeFindOne(Mentee, { userId: req.user._id });

        if (!mentee) {
            console.log('Mentee profile not found for user:', req.user._id);
            return res.status(404).json({ message: 'Mentee profile not found' });
        }

        console.log('Found mentee:', mentee._id);

        const { status } = req.query;
        let query = { menteeId: mentee._id };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        const grievances = await safeFind(Grievance, query, {
            sort: { createdAt: -1 }
        });

        console.log('Found', grievances.length, 'grievances for mentee');
        res.json(grievances);
    } catch (error) {
        console.error('Error fetching mentee grievances:', error);
        res.status(500).json({ message: 'Failed to fetch grievances', error: error.message });
    }
});

// @route   GET /api/grievances/mentor
// @desc    Get mentor's mentees grievances
// @access  Private (Mentor only)
router.get('/mentor', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        console.log('Fetching grievances for mentor user:', req.user._id);

        const mentor = await safeFindOne(Mentor, { userId: req.user._id });

        if (!mentor) {
            console.log('Mentor profile not found for user:', req.user._id);
            return res.status(404).json({ message: 'Mentor profile not found' });
        }

        console.log('Found mentor:', mentor._id);

        const { status } = req.query;
        let query = { mentorId: mentor._id };
        
        if (status && status !== 'all') {
            query.status = status;
        }

        // Manually populate with specific fields
        const populatedGrievances = await executeWithRetry(async () => {
            return Grievance.find(query)
                .populate('menteeId', 'fullName studentId class section')
                .sort({ createdAt: -1 })
                .lean();
        });

        console.log('Found', populatedGrievances.length, 'grievances for mentor');
        res.json(populatedGrievances);
    } catch (error) {
        console.error('Error fetching mentor grievances:', error);
        res.status(500).json({ message: 'Failed to fetch grievances', error: error.message });
    }
});

// @route   GET /api/grievances/admin
// @desc    Get all grievances (Admin only)
// @access  Private (Admin only)
router.get('/admin', auth, roleCheck(['admin']), async (req, res) => {
    try {
        console.log('Fetching all grievances for admin user:', req.user._id);

        const { status, priority } = req.query;
        let query = {};
        
        if (status && status !== 'all') {
            query.status = status;
        }

        // Manually populate with specific fields
        const populatedGrievances = await executeWithRetry(async () => {
            return Grievance.find(query)
                .populate('menteeId', 'fullName studentId class section')
                .populate('mentorId', 'fullName')
                .sort({ createdAt: -1 })
                .lean();
        });

        console.log('Found', populatedGrievances.length, 'grievances for admin');
        res.json(populatedGrievances);
    } catch (error) {
        console.error('Error fetching admin grievances:', error);
        res.status(500).json({ message: 'Failed to fetch grievances', error: error.message });
    }
});

// @route   PUT /api/grievances/:id/review
// @desc    Review grievance (Mentor/Admin)
// @access  Private (Mentor/Admin)
router.put('/:id/review', auth, roleCheck(['mentor', 'admin']), async (req, res) => {
    try {
        const { mentorComments, adminComments, status } = req.body;

        let updateData = {
            status: status || 'in-review',
            reviewedAt: new Date()
        };

        if (req.user.role === 'mentor' && mentorComments) {
            updateData.mentorComments = mentorComments;
        }

        if (req.user.role === 'admin') {
            if (adminComments) updateData.adminComments = adminComments;
        }

        const grievance = await safeUpdate(
            Grievance,
            { _id: req.params.id },
            updateData
        );

        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }

        // Get populated version
        const populatedGrievance = await executeWithRetry(async () => {
            return Grievance.findById(grievance._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentee
        if (populatedGrievance.menteeId) {
            req.io.to(populatedGrievance.menteeId._id.toString()).emit('grievanceStatusUpdate', populatedGrievance);
        }

        res.json(populatedGrievance);
    } catch (error) {
        console.error('Error reviewing grievance:', error);
        res.status(500).json({ message: 'Failed to review grievance' });
    }
});

// @route   PUT /api/grievances/:id/resolve
// @desc    Resolve grievance
// @access  Private (Mentor/Admin)
router.put('/:id/resolve', auth, roleCheck(['mentor', 'admin']), async (req, res) => {
    try {
        const { resolution, mentorComments, adminComments } = req.body;

        let updateData = {
            status: 'resolved',
            resolution,
            resolvedAt: new Date()
        };

        if (req.user.role === 'mentor' && mentorComments) {
            updateData.mentorComments = mentorComments;
        }

        if (req.user.role === 'admin' && adminComments) {
            updateData.adminComments = adminComments;
        }

        const grievance = await safeUpdate(
            Grievance,
            { _id: req.params.id },
            updateData
        );

        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }

        // Get populated version
        const populatedGrievance = await executeWithRetry(async () => {
            return Grievance.findById(grievance._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentee
        if (populatedGrievance.menteeId) {
            req.io.to(populatedGrievance.menteeId._id.toString()).emit('grievanceStatusUpdate', populatedGrievance);
        }

        res.json(populatedGrievance);
    } catch (error) {
        console.error('Error resolving grievance:', error);
        res.status(500).json({ message: 'Failed to resolve grievance' });
    }
});

// @route   PUT /api/grievances/:id/reject
// @desc    Reject grievance
// @access  Private (Mentor/Admin)
router.put('/:id/reject', auth, roleCheck(['mentor', 'admin']), async (req, res) => {
    try {
        const { mentorComments, adminComments } = req.body;

        let updateData = {
            status: 'rejected',
            reviewedAt: new Date()
        };

        if (req.user.role === 'mentor' && mentorComments) {
            updateData.mentorComments = mentorComments;
        }

        if (req.user.role === 'admin' && adminComments) {
            updateData.adminComments = adminComments;
        }

        const grievance = await safeUpdate(
            Grievance,
            { _id: req.params.id },
            updateData
        );

        if (!grievance) {
            return res.status(404).json({ message: 'Grievance not found' });
        }

        // Get populated version
        const populatedGrievance = await executeWithRetry(async () => {
            return Grievance.findById(grievance._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentee
        if (populatedGrievance.menteeId) {
            req.io.to(populatedGrievance.menteeId._id.toString()).emit('grievanceStatusUpdate', populatedGrievance);
        }

        res.json(populatedGrievance);
    } catch (error) {
        console.error('Error rejecting grievance:', error);
        res.status(500).json({ message: 'Failed to reject grievance' });
    }
});

module.exports = router;