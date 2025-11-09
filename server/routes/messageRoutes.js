const express = require('express');
const Message = require('../models/Message');
const Group = require('../models/Group');
const Mentor = require('../models/Mentor');
const Mentee = require('../models/Mentee');
const Guardian = require('../models/Guardian');
const { auth } = require('../middleware/auth');

const normalizeObjectId = (value) => {
    if (!value) return value;
    if (typeof value === 'string') return value;
    if (typeof value.toString === 'function') {
        return value.toString();
    }
    return value;
};

const attachSenderMetadata = async (messageDocs) => {
    if (!messageDocs || messageDocs.length === 0) {
        return [];
    }

    const processed = messageDocs.map((doc) => {
        const messageObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
        const senderObject = messageObj.senderId && typeof messageObj.senderId === 'object' && messageObj.senderId._id
            ? messageObj.senderId
            : null;

        const senderId = senderObject ? senderObject._id.toString() : normalizeObjectId(messageObj.senderId);
        const senderRole = messageObj.senderRole || senderObject?.role;
        const senderEmail = messageObj.senderEmail || senderObject?.email;

        return {
            messageObj,
            senderId,
            senderRole,
            senderEmail
        };
    });

    const guardianUserIds = [...new Set(processed
        .filter((item) => item.senderRole === 'guardian' && item.senderId)
        .map((item) => item.senderId))];

    let guardianProfiles = [];
    if (guardianUserIds.length > 0) {
        guardianProfiles = await Guardian.find({ userId: { $in: guardianUserIds } })
            .select('userId fullName relationship')
            .lean();
    }

    const guardianMap = new Map(
        guardianProfiles.map((guardian) => [guardian.userId.toString(), guardian.fullName])
    );

    const mentorUserIds = [...new Set(processed
        .filter((item) => item.senderRole === 'mentor' && item.senderId)
        .map((item) => item.senderId))];

    let mentorProfiles = [];
    if (mentorUserIds.length > 0) {
        mentorProfiles = await Mentor.find({ userId: { $in: mentorUserIds } })
            .select('userId fullName')
            .lean();
    }

    const mentorMap = new Map(
        mentorProfiles.map((mentor) => [mentor.userId.toString(), mentor.fullName])
    );

    return processed.map(({ messageObj, senderId, senderRole, senderEmail }) => {
        const normalized = {
            ...messageObj,
            senderId,
            senderRole,
            senderEmail
        };

        if (senderRole === 'guardian' && senderId && guardianMap.has(senderId)) {
            normalized.senderName = guardianMap.get(senderId);
        }

        if (senderRole === 'mentor' && senderId && mentorMap.has(senderId)) {
            normalized.senderName = mentorMap.get(senderId);
        }

        normalized._id = normalizeObjectId(normalized._id);
        normalized.conversationId = normalizeObjectId(normalized.conversationId);
        normalized.senderId = normalizeObjectId(normalized.senderId);

        if (Array.isArray(normalized.readBy)) {
            normalized.readBy = normalized.readBy.map((entry) => ({
                ...entry,
                userId: normalizeObjectId(entry.userId)
            }));
        }

        if (normalized.senderId && typeof normalized.senderId === 'object') {
            normalized.senderId = normalizeObjectId(normalized.senderId);
        }

        return normalized;
    });
};

const router = express.Router();

// @route   POST /api/messages
// @desc    Send a message
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const { conversationType, conversationId, content } = req.body;

        if (!['group', 'individual', 'guardian'].includes(conversationType)) {
            return res.status(400).json({ message: 'Invalid conversation type' });
        }

        if (conversationType === 'group' && req.user.role === 'guardian') {
            return res.status(403).json({ message: 'Guardians cannot post in group conversations' });
        }

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Message content is required' });
        }

        // Authorization for individual conversations
        if (conversationType === 'individual') {
            const mentee = await Mentee.findById(conversationId).select('userId mentorId guardianIds');

            if (!mentee) {
                return res.status(404).json({ message: 'Conversation not found' });
            }

            let isAuthorized = false;

            if (req.user.role === 'mentee') {
                isAuthorized = mentee.userId?.toString() === req.user._id.toString();
            } else if (req.user.role === 'mentor') {
                const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
                isAuthorized = mentorProfile && mentee.mentorId?.toString() === mentorProfile._id.toString();
            } else if (req.user.role === 'guardian') {
                const guardianProfile = await Guardian.findOne({ userId: req.user._id }).select('menteeIds');
                isAuthorized = guardianProfile?.menteeIds?.some(id => id.toString() === mentee._id.toString());
            }

            if (!isAuthorized) {
                return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
            }
        } else if (conversationType === 'guardian') {
            const guardian = await Guardian.findById(conversationId).select('userId menteeIds relationship');

            if (!guardian) {
                return res.status(404).json({ message: 'Guardian conversation not found' });
            }

            if (req.user.role === 'guardian') {
                if (guardian.userId?.toString() !== req.user._id.toString()) {
                    return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
                }
            } else if (req.user.role === 'mentor') {
                const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
                if (!mentorProfile) {
                    return res.status(403).json({ message: 'Mentor profile not found' });
                }

                const linkedMentees = await Mentee.find({
                    _id: { $in: guardian.menteeIds },
                    mentorId: mentorProfile._id
                }).select('_id');

                if (!linkedMentees.length) {
                    return res.status(403).json({ message: 'Not authorized to message this guardian' });
                }
            } else {
                return res.status(403).json({ message: 'Not authorized to send messages in this conversation' });
            }
        }

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

        const [messageWithSender] = await attachSenderMetadata([message]);

        // Emit socket event for real-time messaging
        if (conversationType === 'group') {
            // For group messages, emit to all group members
            const group = await Group.findById(conversationId).populate('menteeIds', '_id');
            if (group) {
                // Emit to group room
                req.io.to(conversationId.toString()).emit('newMessage', messageWithSender);

                // Also emit to each mentee's personal room for notifications
                group.menteeIds.forEach(mentee => {
                    req.io.to(mentee._id.toString()).emit('newMessage', messageWithSender);
                });

                // Emit to mentor's personal room
                req.io.to(group.mentorId.toString()).emit('newMessage', messageWithSender);
            }
        } else if (conversationType === 'guardian') {
            // For guardian chats, emit to guardian and mentor
            const guardian = await Guardian.findById(conversationId).select('userId menteeIds');
            if (guardian) {
                // Emit to guardian's room
                req.io.to(guardian.userId.toString()).emit('newMessage', messageWithSender);
                
                // Find mentors of guardian's mentees and emit to them
                const mentees = await Mentee.find({ _id: { $in: guardian.menteeIds } }).select('mentorId');
                const mentorIds = [...new Set(mentees.map(m => m.mentorId?.toString()).filter(Boolean))];
                
                for (const mentorId of mentorIds) {
                    const mentor = await Mentor.findById(mentorId).select('userId');
                    if (mentor) {
                        req.io.to(mentor.userId.toString()).emit('newMessage', messageWithSender);
                    }
                }
                
                // Emit to conversation room as well
                req.io.to(conversationId.toString()).emit('newMessage', messageWithSender);
            }
        } else {
            // For individual chats, emit to both users' individual rooms
            req.io.to(conversationId.toString()).emit('newMessage', messageWithSender);
            req.io.to(req.user._id.toString()).emit('newMessage', messageWithSender);
        }

        res.status(201).json(messageWithSender);
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

        const rawMessages = await Message.find({
            conversationType: 'group',
            conversationId: req.params.groupId
        })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const messages = await attachSenderMetadata(rawMessages);

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

        const mentee = await Mentee.findById(req.params.conversationId).select('userId mentorId guardianIds');

        if (!mentee) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        let isAuthorized = false;

        if (req.user.role === 'mentee') {
            isAuthorized = mentee.userId?.toString() === req.user._id.toString();
        } else if (req.user.role === 'mentor') {
            const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
            isAuthorized = mentorProfile && mentee.mentorId?.toString() === mentorProfile._id.toString();
        } else if (req.user.role === 'guardian') {
            const guardianProfile = await Guardian.findOne({ userId: req.user._id }).select('menteeIds');
            isAuthorized = guardianProfile?.menteeIds?.some(id => id.toString() === mentee._id.toString());
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        const rawMessages = await Message.find({
            conversationType: 'individual',
            conversationId: req.params.conversationId
        })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const messages = await attachSenderMetadata(rawMessages);

        res.json(messages.reverse());
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/messages/guardian/:conversationId
// @desc    Get guardian conversation messages
// @access  Private
router.get('/guardian/:conversationId', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const guardian = await Guardian.findById(req.params.conversationId).select('userId menteeIds');

        if (!guardian) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        let isAuthorized = false;

        if (req.user.role === 'guardian') {
            isAuthorized = guardian.userId?.toString() === req.user._id.toString();
        } else if (req.user.role === 'mentor') {
            const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
            if (mentorProfile) {
                const linkedMentees = await Mentee.find({
                    _id: { $in: guardian.menteeIds },
                    mentorId: mentorProfile._id
                }).select('_id');

                isAuthorized = linkedMentees.length > 0;
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to view this conversation' });
        }

        const rawMessages = await Message.find({
            conversationType: 'guardian',
            conversationId: req.params.conversationId
        })
            .populate('senderId', 'email role')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const messages = await attachSenderMetadata(rawMessages);

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

// @route   DELETE /api/messages/conversation/:type/:id
// @desc    Delete all messages in a conversation
// @access  Private
router.delete('/conversation/:type/:id', auth, async (req, res) => {
    try {
        const { type, id } = req.params;
        if (!['group', 'individual', 'guardian'].includes(type)) {
            return res.status(400).json({ message: 'Invalid conversation type' });
        }

        let isAuthorized = false;

        if (type === 'group') {
            const group = await Group.findById(id).select('mentorId menteeIds');
            if (!group) {
                return res.status(404).json({ message: 'Group not found' });
            }

            if (req.user.role === 'mentor') {
                const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
                if (mentorProfile && group.mentorId?.toString() === mentorProfile._id.toString()) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized && req.user.role === 'mentee') {
                const menteeProfile = await Mentee.findOne({ userId: req.user._id }).select('_id');
                if (menteeProfile && group.menteeIds.some(menteeId => menteeId.toString() === menteeProfile._id.toString())) {
                    isAuthorized = true;
                }
            }
        } else if (type === 'individual') {
            const mentee = await Mentee.findById(id).select('mentorId userId');
            if (!mentee) {
                return res.status(404).json({ message: 'Conversation not found' });
            }

            if (req.user.role === 'mentor') {
                const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
                if (mentorProfile && mentee.mentorId?.toString() === mentorProfile._id.toString()) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized && req.user.role === 'mentee') {
                if (mentee.userId?.toString() === req.user._id.toString()) {
                    isAuthorized = true;
                }
            }

            if (!isAuthorized && req.user.role === 'guardian') {
                const guardianProfile = await Guardian.findOne({ userId: req.user._id }).select('menteeIds');
                if (guardianProfile?.menteeIds?.some(menteeId => menteeId.toString() === id)) {
                    isAuthorized = true;
                }
            }
        } else {
            const guardian = await Guardian.findById(id).select('userId menteeIds');
            if (!guardian) {
                return res.status(404).json({ message: 'Conversation not found' });
            }

            if (req.user.role === 'guardian' && guardian.userId?.toString() === req.user._id.toString()) {
                isAuthorized = true;
            }

            if (!isAuthorized && req.user.role === 'mentor') {
                const mentorProfile = await Mentor.findOne({ userId: req.user._id }).select('_id');
                if (mentorProfile) {
                    const linkedMentees = await Mentee.find({
                        _id: { $in: guardian.menteeIds },
                        mentorId: mentorProfile._id
                    }).select('_id');

                    if (linkedMentees.length > 0) {
                        isAuthorized = true;
                    }
                }
            }
        }

        if (!isAuthorized) {
            return res.status(403).json({ message: 'Not authorized to delete this conversation' });
        }

        await Message.deleteMany({ conversationType: type, conversationId: id });

        res.json({ message: 'Conversation deleted successfully' });
    } catch (error) {
        console.error('Error deleting conversation:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;