const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Candidate } = require('../models/db');

const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role, name, position, bio, photoUrl } = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        // Create user
        const userId = await User.create(email, password, role);

        // If candidate, create candidate profile
        if (role === 'candidate') {
            if (!name || !position) {
                return res.status(400).json({ message: 'Name and position required for candidates' });
            }
            await Candidate.create(userId, name, position, bio || '', photoUrl || '');
        }

        res.status(201).json({
            message: role === 'candidate'
                ? 'Candidate registered. Awaiting admin verification.'
                : 'Voter registered. Awaiting admin verification.'
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check verification for non-admin users
        if (user.role !== 'admin' && !user.is_verified) {
            return res.status(403).json({ message: 'Account pending admin verification' });
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRE }
        );

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                isVerified: user.is_verified,
                isVoted: user.is_voted
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { register, login };