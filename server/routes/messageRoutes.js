const express = require('express');
const Message = require('../models/Message');
const Group = require('../models/Group');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { conversationType, conversationId, content } = req.body;

        const message = new Message({
            conversationType,
            conversationId,
            senderId: req.user._id,
            senderRole: req.user.role,
            content,
            readBy: [{ userId: req.user._id }]
        });

        await message.save();

        // Populate sender information for real-time messaging
        await message.populate('senderId', 'email role');

        // Emit socket event for real-time messaging
        if (conversationType === 'group') {
            // For group messages, emit to all group members
            const group = await Group.findById(conversationId).populate('menteeIds', '_id');
            if (group) {
                // Emit to group room
                req.io.to(conversationId.toString()).emit('newMessage', message);

                // Also emit to each mentee's personal room for notifications
                group.menteeIds.forEach(mentee => {
                    req.io.to(mentee._id.toString()).emit('newMessage', message);
                });

                // Emit to mentor's personal room
                req.io.to(group.mentorId.toString()).emit('newMessage', message);
            }
        } else {
            // For individual chats, emit to both users' individual rooms
            req.io.to(conversationId.toString()).emit('newMessage', message);
            req.io.to(req.user._id.toString()).emit('newMessage', message);
        }

        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/messages/group/:groupId
// @desc    Get group messages
// @access  Private
router.get('/group/:groupId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({
            conversationType: 'group',
            conversationId: req.params.groupId
        })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/messages/individual/:conversationId
// @desc    Get individual messages
// @access  Private
router.get('/individual/:conversationId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const messages = await Message.find({
            conversationType: 'individual',
            conversationId: req.params.conversationId
        })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/messages/:id/read
// @desc    Mark message as read
// @access  Private
router.put('/:id/read', auth, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        // Check if user already marked as read
        const alreadyRead = message.readBy.some(
            read => read.userId.toString() === req.user._id.toString()
        );

        if (!alreadyRead) {
            message.readBy.push({ userId: req.user._id });
            await message.save();
        }

        res.json({ message: 'Message marked as read' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;