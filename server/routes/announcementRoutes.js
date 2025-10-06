const express = require('express');
const Announcement = require('../models/Announcement');
const { auth } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/announcements/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Invalid file type'));
        }
    }
});

// @route   POST /api/announcements
// @desc    Create announcement
// @access  Private (Admin/Mentor only)
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
    try {
        if (req.user.role !== 'admin' && req.user.role !== 'mentor') {
            return res.status(403).json({ message: 'Access denied' });
        }

        const { title, content, targetAudience, priority } = req.body;

        const attachments = req.files ? req.files.map(file => ({
            filename: file.filename,
            originalName: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            url: `/uploads/announcements/${file.filename}`
        })) : [];

        const announcement = new Announcement({
            title,
            content,
            authorId: req.user._id,
            authorRole: req.user.role,
            targetAudience: targetAudience || 'all',
            priority: priority || 'medium',
            attachments
        });

        await announcement.save();
        await announcement.populate('authorId', 'email');

        // Emit socket event for real-time notifications
        req.io.emit('newAnnouncement', announcement);

        res.status(201).json(announcement);
    } catch (error) {
        console.error('Error creating announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/announcements
// @desc    Get announcements
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { page = 1, limit = 20, priority, targetAudience } = req.query;

        const filter = { isActive: true };

        // Filter by target audience
        if (targetAudience) {
            filter.targetAudience = { $in: [targetAudience, 'all'] };
        } else {
            // Default filter based on user role
            if (req.user.role === 'mentee') {
                filter.targetAudience = { $in: ['mentees', 'all'] };
            } else if (req.user.role === 'mentor') {
                filter.targetAudience = { $in: ['mentors', 'all'] };
            }
        }

        if (priority) {
            filter.priority = priority;
        }

        const announcements = await Announcement.find(filter)
            .populate('authorId', 'email')
            .sort({ priority: -1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Announcement.countDocuments(filter);

        res.json({
            announcements,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error fetching announcements:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/announcements/:id/read
// @desc    Mark announcement as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if user already marked as read
        const alreadyRead = announcement.readBy.some(
            read => read.userId.toString() === req.user._id.toString()
        );

        if (!alreadyRead) {
            announcement.readBy.push({ userId: req.user._id });
            await announcement.save();
        }

        res.json({ message: 'Announcement marked as read' });
    } catch (error) {
        console.error('Error marking announcement as read:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/announcements/:id/comments
// @desc    Add comment to announcement
// @access  Private
router.post('/:id/comments', auth, async (req, res) => {
    try {
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Comment content is required' });
        }

        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        const comment = {
            userId: req.user._id,
            userRole: req.user.role,
            content: content.trim(),
            createdAt: new Date()
        };

        announcement.comments.push(comment);
        await announcement.save();

        // Populate the comment with user info
        await announcement.populate('comments.userId', 'email');

        const newComment = announcement.comments[announcement.comments.length - 1];

        // Emit socket event for real-time comments
        req.io.emit('newAnnouncementComment', {
            announcementId: req.params.id,
            comment: newComment
        });

        res.status(201).json(newComment);
    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/announcements/:id/comments
// @desc    Get announcement comments
// @access  Private
router.get('/:id/comments', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id)
            .populate('comments.userId', 'email role')
            .select('comments');

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        res.json(announcement.comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)));
    } catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/announcements/:id
// @desc    Delete announcement
// @access  Private (Admin/Author only)
router.delete('/:id', auth, async (req, res) => {
    try {
        const announcement = await Announcement.findById(req.params.id);

        if (!announcement) {
            return res.status(404).json({ message: 'Announcement not found' });
        }

        // Check if user is admin or the author
        if (req.user.role !== 'admin' && announcement.authorId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        announcement.isActive = false;
        await announcement.save();

        res.json({ message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Error deleting announcement:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;