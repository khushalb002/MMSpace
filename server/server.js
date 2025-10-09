const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const dbErrorHandler = require('./middleware/dbErrorHandler');
const dbConnectionCheck = require('./middleware/dbConnectionCheck');
const rateLimit = require('express-rate-limit');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Very lenient rate limiting for development
const limiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 1000, // Very high limit for development
    message: { message: 'Too many requests, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // Count all requests
    skip: (req) => {
        // Skip rate limiting for health checks and in development
        return req.path === '/api/health' || process.env.NODE_ENV === 'development';
    }
});

// Middleware
app.use(limiter);
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use('/uploads', express.static('uploads'));

// Check database connection before processing requests
app.use(dbConnectionCheck);

// Make io accessible to routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/mentors', require('./routes/mentorRoutes'));
app.use('/api/mentees', require('./routes/menteeRoutes'));
app.use('/api/groups', require('./routes/groupRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/grievances', require('./routes/grievanceRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/announcements', require('./routes/announcementRoutes'));

// Health check
app.get('/api/health', async (req, res) => {
    try {
        // Check database connection
        const mongoose = require('mongoose');
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

        res.json({
            status: 'OK',
            message: 'Server is running',
            database: dbStatus,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            status: 'ERROR',
            message: 'Health check failed',
            error: error.message
        });
    }
});

// Socket.io connection handling
require('./socket/socketHandlers')(io);

// Error handling middleware (order matters)
app.use(dbErrorHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Start server only after database connection
const startServer = async () => {
    try {
        // Connect to database first
        await connectDB();

        // Start server after successful database connection
        server.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Database connection status: ${require('mongoose').connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();