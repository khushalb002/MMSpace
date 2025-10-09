const express = require('express');
const LeaveRequest = require('../models/LeaveRequest');
const Mentee = require('../models/Mentee');
const Mentor = require('../models/Mentor');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const { safeFindOne, safeFind, safeSave, safeUpdate, executeWithRetry } = require('../utils/dbUtils');

const router = express.Router();

// @route   POST /api/leaves
// @desc    Submit leave request
// @access  Private (Mentee only)
router.post('/', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        const mentee = await safeFindOne(Mentee, { userId: req.user._id });

        if (!mentee) {
            return res.status(404).json({ message: 'Mentee profile not found' });
        }

        const { leaveType, startDate, endDate, reason } = req.body;

        // Calculate days count
        const start = new Date(startDate);
        const end = new Date(endDate);
        const daysCount = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

        const leaveRequest = new LeaveRequest({
            menteeId: mentee._id,
            mentorId: mentee.mentorId,
            leaveType,
            startDate,
            endDate,
            daysCount,
            reason
        });

        const savedLeaveRequest = await safeSave(leaveRequest);

        // Populate the saved request
        const populatedRequest = await executeWithRetry(async () => {
            return LeaveRequest.findById(savedLeaveRequest._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentor
        if (mentee.mentorId) {
            req.io.to(mentee.mentorId.toString()).emit('newLeaveRequest', populatedRequest);
        }

        res.status(201).json(populatedRequest);
    } catch (error) {
        console.error('Error creating leave request:', error);
        res.status(500).json({ message: 'Failed to create leave request' });
    }
});

// @route   GET /api/leaves/mentee
// @desc    Get mentee's leave requests
// @access  Private (Mentee only)
router.get('/mentee', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        console.log('Fetching leave requests for mentee user:', req.user._id);

        const mentee = await safeFindOne(Mentee, { userId: req.user._id });

        if (!mentee) {
            console.log('Mentee profile not found for user:', req.user._id);
            return res.status(404).json({ message: 'Mentee profile not found' });
        }

        console.log('Found mentee:', mentee._id);

        const leaves = await safeFind(LeaveRequest, { menteeId: mentee._id }, {
            sort: { createdAt: -1 }
        });

        console.log('Found', leaves.length, 'leave requests for mentee');
        res.json(leaves);
    } catch (error) {
        console.error('Error fetching mentee leave requests:', error);
        res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
    }
});

// @route   GET /api/leaves/mentor
// @desc    Get mentor's mentees leave requests
// @access  Private (Mentor only)
router.get('/mentor', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        console.log('Fetching leave requests for mentor user:', req.user._id);

        const mentor = await safeFindOne(Mentor, { userId: req.user._id });

        if (!mentor) {
            console.log('Mentor profile not found for user:', req.user._id);
            return res.status(404).json({ message: 'Mentor profile not found' });
        }

        console.log('Found mentor:', mentor._id);

        const { status } = req.query;
        console.log('Status filter:', status);

        let query = { mentorId: mentor._id };
        if (status) {
            query.status = status;
        }

        console.log('Query:', query);

        // Manually populate with specific fields since safeFind doesn't support field selection in populate
        const populatedLeaves = await executeWithRetry(async () => {
            return LeaveRequest.find(query)
                .populate('menteeId', 'fullName studentId class section')
                .sort({ createdAt: -1 })
                .lean();
        });

        console.log('Found', populatedLeaves.length, 'leave requests for mentor');
        res.json(populatedLeaves);
    } catch (error) {
        console.error('Error fetching mentor leave requests:', error);
        res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
    }
});

// @route   PUT /api/leaves/:id/approve
// @desc    Approve leave request
// @access  Private (Mentor/Admin)
router.put('/:id/approve', auth, roleCheck(['mentor', 'admin']), async (req, res) => {
    try {
        const { mentorComments } = req.body;

        const leaveRequest = await safeUpdate(
            LeaveRequest,
            { _id: req.params.id },
            {
                status: 'approved',
                mentorComments,
                reviewedAt: new Date()
            }
        );

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Get populated version
        const populatedRequest = await executeWithRetry(async () => {
            return LeaveRequest.findById(leaveRequest._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentee
        if (populatedRequest.menteeId) {
            req.io.to(populatedRequest.menteeId._id.toString()).emit('leaveStatusUpdate', populatedRequest);
        }

        res.json(populatedRequest);
    } catch (error) {
        console.error('Error approving leave request:', error);
        res.status(500).json({ message: 'Failed to approve leave request' });
    }
});

// @route   PUT /api/leaves/:id/reject
// @desc    Reject leave request
// @access  Private (Mentor/Admin)
router.put('/:id/reject', auth, roleCheck(['mentor', 'admin']), async (req, res) => {
    try {
        const { mentorComments } = req.body;

        const leaveRequest = await safeUpdate(
            LeaveRequest,
            { _id: req.params.id },
            {
                status: 'rejected',
                mentorComments,
                reviewedAt: new Date()
            }
        );

        if (!leaveRequest) {
            return res.status(404).json({ message: 'Leave request not found' });
        }

        // Get populated version
        const populatedRequest = await executeWithRetry(async () => {
            return LeaveRequest.findById(leaveRequest._id)
                .populate('menteeId', 'fullName studentId')
                .lean();
        });

        // Emit notification to mentee
        if (populatedRequest.menteeId) {
            req.io.to(populatedRequest.menteeId._id.toString()).emit('leaveStatusUpdate', populatedRequest);
        }

        res.json(populatedRequest);
    } catch (error) {
        console.error('Error rejecting leave request:', error);
        res.status(500).json({ message: 'Failed to reject leave request' });
    }
});

// @route   GET /api/leaves/admin
// @desc    Get all leave requests (Admin only)
// @access  Private (Admin only)
router.get('/admin', auth, roleCheck(['admin']), async (req, res) => {
    try {
        console.log('Fetching all leave requests for admin user:', req.user._id);

        const { status } = req.query;
        let query = {};

        if (status && status !== 'all') {
            query.status = status;
        }

        // Manually populate with specific fields
        const populatedLeaves = await executeWithRetry(async () => {
            return LeaveRequest.find(query)
                .populate('menteeId', 'fullName studentId class section')
                .populate('mentorId', 'fullName')
                .sort({ createdAt: -1 })
                .lean();
        });

        console.log('Found', populatedLeaves.length, 'leave requests for admin');
        res.json(populatedLeaves);
    } catch (error) {
        console.error('Error fetching admin leave requests:', error);
        res.status(500).json({ message: 'Failed to fetch leave requests', error: error.message });
    }
});

module.exports = router;