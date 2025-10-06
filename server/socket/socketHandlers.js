const jwt = require('jsonwebtoken');
const User = require('../models/User');

const socketAuth = async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if (!user) {
            return next(new Error('Authentication error'));
        }

        socket.userId = user._id.toString();
        socket.userRole = user.role;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
};

module.exports = (io) => {
    // Authentication middleware
    io.use(socketAuth);

    io.on('connection', (socket) => {
        console.log(`User ${socket.userId} connected`);

        // Join user to their personal room for notifications
        socket.join(socket.userId);

        // Join group rooms
        socket.on('joinGroup', (groupId) => {
            socket.join(groupId);
            console.log(`User ${socket.userId} joined group ${groupId}`);
        });

        // Leave group rooms
        socket.on('leaveGroup', (groupId) => {
            socket.leave(groupId);
            console.log(`User ${socket.userId} left group ${groupId}`);
        });

        // Auto-join mentees to their groups
        if (socket.userRole === 'mentee') {
            const Group = require('../models/Group');
            const Mentee = require('../models/Mentee');

            console.log(`Auto-joining mentee ${socket.userId} to their groups...`);

            // Find mentee and their groups
            Mentee.findOne({ userId: socket.userId })
                .then(mentee => {
                    console.log(`Found mentee:`, mentee?._id);
                    if (mentee) {
                        return Group.find({ menteeIds: mentee._id });
                    }
                    return [];
                })
                .then(groups => {
                    console.log(`Found ${groups.length} groups for mentee ${socket.userId}`);
                    groups.forEach(group => {
                        socket.join(group._id.toString());
                        console.log(`Mentee ${socket.userId} auto-joined group ${group._id} (${group.name})`);
                    });
                })
                .catch(err => {
                    console.error('Error auto-joining mentee to groups:', err);
                });
        }

        // Handle typing indicators
        socket.on('typing', (data) => {
            socket.to(data.conversationId).emit('userTyping', {
                userId: socket.userId,
                isTyping: data.isTyping
            });
        });

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`User ${socket.userId} disconnected`);
        });
    });
};