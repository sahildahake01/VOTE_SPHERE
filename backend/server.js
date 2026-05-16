const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const { initAdmin } = require('./models/db');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const voterRoutes = require('./routes/voter');
const candidateRoutes = require('./routes/candidate');

const app = express();

// Security
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests, please try again later.'
});
app.use('/api/', limiter);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/voter', voterRoutes);
app.use('/api/candidate', candidateRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../frontend')));
    app.get('*', (req, res) => {
        res.sendFile(path.join(__dirname, '../frontend/index.html'));
    });
}

const PORT = process.env.PORT || 5000;

// Initialize admin and start server
initAdmin().then(() => {
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📧 Admin Email: ${process.env.ADMIN_EMAIL}`);
        console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD}`);
    });
}).catch(err => {
    console.error('Failed to initialize admin:', err);
    process.exit(1);
});