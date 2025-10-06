const express = require('express');
const Message = require('../models/Message');
const Group = require('../models/Group');
const auth = require('../middleware/auth');
const { messageRateLimit, messageBurstLimit, spamDetection } = require('../middleware/messageRateLimit');

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        console.log(`[${new Date().toISOString()}] Message send request from user: ${req.user.email}`);
        console.log('Request body:', req.body);

        const { conversationType, conversationId, content } = req.body;

        // Basic validation only - allow all messages through
        if (!conversationType || !conversationId || !content) {
            return res.status(400).json({ 
                message: 'Missing required fields',
                required: ['conversationType', 'conversationId', 'content']
            });
        }

        if (!['group', 'individual'].includes(conversationType)) {
            return res.status(400).json({ 
                message: 'Invalid conversation type. Must be "group" or "individual"'
            });
        }

        // Create and save message efficiently
        const message = new Message({
            conversationType,
            conversationId,
            senderId: req.user._id,
            senderRole: req.user.role,
            content: typeof content === 'string' ? content.trim() : content,
            readBy: [{ userId: req.user._id }]
        });

        // Save message to database
        await message.save();

        // Populate sender information for response
        await message.populate('senderId', 'email role');

        // Emit socket event asynchronously (don't wait for it)
        setImmediate(() => {
            try {
                if (req.io) {
                    if (conversationType === 'group') {
                        req.io.to(conversationId.toString()).emit('newMessage', message);
                    } else {
                        req.io.to(conversationId.toString()).emit('newMessage', message);
                        req.io.to(req.user._id.toString()).emit('newMessage', message);
                    }
                }
            } catch (socketError) {
                console.error('Socket emission error (non-blocking):', socketError.message);
            }
        });

        // Respond immediately without waiting for socket emission
        res.status(201).json(message);
    } catch (error) {
        console.error('Error sending message:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ 
            message: 'Server error while sending message',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
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