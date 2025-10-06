const express = require('express');
const Group = require('../models/Group');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const { auth } = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

const router = express.Router();

// @route   POST /api/groups
// @desc    Create a new group
// @access  Private (Mentor only)
router.post('/', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ userId: req.user._id });
        const { name, description, color, menteeIds } = req.body;

        const group = new Group({
            name,
            mentorId: mentor._id,
            description,
            color: color || '#3B82F6',
            menteeIds: menteeIds || []
        });

        await group.save();
        await group.populate('menteeIds', 'fullName studentId class section');

        res.status(201).json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups
// @desc    Get all groups for mentor
// @access  Private (Mentor only)
router.get('/', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const mentor = await Mentor.findOne({ userId: req.user._id });
        const groups = await Group.find({
            mentorId: mentor._id,
            isArchived: false
        }).populate('menteeIds', 'fullName studentId class section');

        res.json(groups);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups/mentee
// @desc    Get all groups that mentee belongs to
// @access  Private (Mentee only)
router.get('/mentee', auth, roleCheck(['mentee']), async (req, res) => {
    try {
        const mentee = await Mentee.findOne({ userId: req.user._id });
        if (!mentee) {
            return res.status(404).json({ message: 'Mentee profile not found' });
        }

        const groups = await Group.find({
            menteeIds: mentee._id,
            isArchived: false
        }).populate('mentorId', 'fullName department');

        res.json(groups);
    } catch (error) {
        console.error('Error fetching mentee groups:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups/:id
// @desc    Get group details
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('menteeIds', 'fullName studentId class section phone')
            .populate('mentorId', 'fullName department');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Check if user has access to this group
        if (req.user.role === 'mentee') {
            const mentee = await Mentee.findOne({ userId: req.user._id });
            if (!mentee || !group.menteeIds.some(id => id._id.toString() === mentee._id.toString())) {
                return res.status(403).json({ message: 'Access denied' });
            }
        } else if (req.user.role === 'mentor') {
            const mentor = await Mentor.findOne({ userId: req.user._id });
            if (!mentor || group.mentorId._id.toString() !== mentor._id.toString()) {
                return res.status(403).json({ message: 'Access denied' });
            }
        }

        res.json(group);
    } catch (error) {
        console.error('Error fetching group details:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/groups/:id/details
// @desc    Get detailed group information with members
// @access  Private
router.get('/:id/details', auth, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id)
            .populate('menteeIds', 'fullName studentId class section phone email')
            .populate('mentorId', 'fullName department email');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        // Format the response for the details modal
        const groupDetails = {
            _id: group._id,
            name: group.name,
            description: group.description,
            color: group.color,
            createdAt: group.createdAt,
            members: group.menteeIds,
            mentor: group.mentorId
        };

        res.json(groupDetails);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/groups/:id
// @desc    Update group
// @access  Private (Mentor only)
router.put('/:id', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const { name, description, color, menteeIds } = req.body;

        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { name, description, color, menteeIds },
            { new: true }
        ).populate('menteeIds', 'fullName studentId class section');

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json(group);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/groups/:id
// @desc    Archive group
// @access  Private (Mentor only)
router.delete('/:id', auth, roleCheck(['mentor']), async (req, res) => {
    try {
        const group = await Group.findByIdAndUpdate(
            req.params.id,
            { isArchived: true },
            { new: true }
        );

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.json({ message: 'Group archived successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;