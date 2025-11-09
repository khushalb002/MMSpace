const express = require('express');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Guardian = require('../models/Guardian');
const Mentee = require('../models/Mentee');
const Grievance = require('../models/Grievance');

const router = express.Router();

// @route   GET /api/guardians/profile
// @desc    Get guardian profile with linked mentees
// @access  Private (Guardian only)
router.get('/profile', auth, roleCheck(['guardian']), async (req, res) => {
    try {
        const guardian = await Guardian.findOne({ userId: req.user._id })
            .populate({
                path: 'menteeIds',
                select: 'fullName studentId class section attendance mentorId guardianIds',
                populate: {
                    path: 'mentorId',
                    select: 'fullName department phone'
                }
            })
            .lean();

        if (!guardian) {
            return res.status(404).json({ message: 'Guardian profile not found' });
        }

        res.json(guardian);
    } catch (error) {
        console.error('Error fetching guardian profile:', error);
        res.status(500).json({ message: 'Failed to fetch guardian profile' });
    }
});

// @route   GET /api/guardians/mentees
// @desc    Get mentees linked to guardian
// @access  Private (Guardian only)
router.get('/mentees', auth, roleCheck(['guardian']), async (req, res) => {
    try {
        const guardian = await Guardian.findOne({ userId: req.user._id }).lean();

        if (!guardian) {
            return res.status(404).json({ message: 'Guardian profile not found' });
        }

        if (!guardian.menteeIds?.length) {
            return res.json([]);
        }

        const mentees = await Mentee.find({ _id: { $in: guardian.menteeIds } })
            .populate('mentorId', 'fullName department phone')
            .lean();

        res.json(mentees);
    } catch (error) {
        console.error('Error fetching guardian mentees:', error);
        res.status(500).json({ message: 'Failed to fetch mentees' });
    }
});

// @route   GET /api/guardians/dashboard
// @desc    Get aggregated dashboard data for guardian
// @access  Private (Guardian only)
router.get('/dashboard', auth, roleCheck(['guardian']), async (req, res) => {
    try {
        const guardian = await Guardian.findOne({ userId: req.user._id }).lean();

        if (!guardian) {
            return res.status(404).json({ message: 'Guardian profile not found' });
        }

        const menteeIds = guardian.menteeIds || [];

        let grievances = [];
        let pendingGrievances = 0;
        let resolvedGrievances = 0;

        if (menteeIds.length > 0) {
            grievances = await Grievance.find({ menteeId: { $in: menteeIds } })
                .populate('menteeId', 'fullName studentId class section')
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            pendingGrievances = grievances.filter(grievance => ['pending', 'in-review'].includes(grievance.status)).length;
            resolvedGrievances = grievances.filter(grievance => grievance.status === 'resolved').length;
        }

        res.json({
            stats: {
                totalMentees: menteeIds.length,
                pendingGrievances,
                resolvedGrievances
            },
            recentGrievances: grievances
        });
    } catch (error) {
        console.error('Error fetching guardian dashboard:', error);
        res.status(500).json({ message: 'Failed to fetch guardian dashboard data' });
    }
});

module.exports = router;
