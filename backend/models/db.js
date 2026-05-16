const pool = require('../config/database');
const bcrypt = require('bcryptjs');

// Initialize admin user if not exists
const initAdmin = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@voting.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
        const hashedPassword = await bcrypt.hash(adminPassword, 10);

        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ?',
            [adminEmail]
        );

        if (existing.length === 0) {
            await pool.execute(
                'INSERT INTO users (email, password, role, is_verified) VALUES (?, ?, "admin", TRUE)',
                [adminEmail, hashedPassword]
            );
            console.log('✅ Admin user created');
        } else {
            console.log('✅ Admin user already exists');
        }
    } catch (error) {
        console.error('Admin init error:', error.message);
    }
};

// User Model
const User = {
    findByEmail: async (email) => {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0] || null;
    },
    findById: async (id) => {
        const [rows] = await pool.execute('SELECT id, email, role, is_verified, is_voted FROM users WHERE id = ?', [id]);
        return rows[0] || null;
    },
    create: async (email, password, role) => {
        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.execute(
            'INSERT INTO users (email, password, role, is_verified) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, role, role === 'admin']
        );
        return result.insertId;
    },
    updateVerification: async (userId, isVerified) => {
        const [result] = await pool.execute(
            'UPDATE users SET is_verified = ? WHERE id = ?',
            [isVerified, userId]
        );
        return result.affectedRows > 0;
    },
    markAsVoted: async (userId) => {
        const [result] = await pool.execute(
            'UPDATE users SET is_voted = TRUE WHERE id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    }
};

// Candidate Model
const Candidate = {
    create: async (userId, name, position, bio = '', photoUrl = '') => {
        const [result] = await pool.execute(
            'INSERT INTO candidates (user_id, name, position, bio, photo_url) VALUES (?, ?, ?, ?, ?)',
            [userId, name, position, bio, photoUrl]
        );
        return result.insertId;
    },
    findByUserId: async (userId) => {
        const [rows] = await pool.execute(
            `SELECT c.*, u.email, u.is_verified 
             FROM candidates c
             JOIN users u ON c.user_id = u.id
             WHERE c.user_id = ?`,
            [userId]
        );
        return rows[0] || null;
    },
    update: async (userId, data) => {
        const { name, position, bio, photoUrl } = data;
        const [result] = await pool.execute(
            'UPDATE candidates SET name = ?, position = ?, bio = ?, photo_url = ? WHERE user_id = ?',
            [name, position, bio, photoUrl, userId]
        );
        return result.affectedRows > 0;
    },
    getAllVerified: async () => {
        const [rows] = await pool.execute(
            `SELECT c.*, u.email 
             FROM candidates c
             JOIN users u ON c.user_id = u.id
             WHERE u.is_verified = TRUE
             ORDER BY c.vote_count DESC`
        );
        return rows;
    },
    incrementVotes: async (candidateId) => {
        const [result] = await pool.execute(
            'UPDATE candidates SET vote_count = vote_count + 1 WHERE id = ?',
            [candidateId]
        );
        return result.affectedRows > 0;
    }
};

// Vote Model
const Vote = {
    create: async (voterId, candidateId) => {
        const [result] = await pool.execute(
            'INSERT INTO votes (voter_id, candidate_id) VALUES (?, ?)',
            [voterId, candidateId]
        );
        return result.insertId;
    },
    hasVoted: async (voterId) => {
        const [rows] = await pool.execute('SELECT id FROM votes WHERE voter_id = ?', [voterId]);
        return rows.length > 0;
    },
    getCountByCandidate: async (candidateId) => {
        const [rows] = await pool.execute(
            'SELECT COUNT(*) as count FROM votes WHERE candidate_id = ?',
            [candidateId]
        );
        return rows[0].count;
    },
    getResults: async () => {
        const [rows] = await pool.execute(`
            SELECT 
                c.id,
                c.name,
                c.position,
                c.vote_count as manual_votes,
                COUNT(v.id) as actual_votes,
                (c.vote_count + COUNT(v.id)) as total_votes
            FROM candidates c
            LEFT JOIN votes v ON c.id = v.candidate_id
            GROUP BY c.id
            ORDER BY total_votes DESC
        `);
        return rows;
    }
};

// Election Model
const Election = {
    getStatus: async () => {
        const [rows] = await pool.execute(
            'SELECT id, title, is_active, started_at, ended_at FROM elections ORDER BY id DESC LIMIT 1'
        );
        return rows[0] || { is_active: false };
    },
    start: async () => {
        const [result] = await pool.execute(
            'UPDATE elections SET is_active = TRUE, started_at = NOW() WHERE id = 1'
        );
        return result.affectedRows > 0;
    },
    end: async () => {
        const [result] = await pool.execute(
            'UPDATE elections SET is_active = FALSE, ended_at = NOW() WHERE id = 1'
        );
        return result.affectedRows > 0;
    }
};

module.exports = { User, Candidate, Vote, Election, initAdmin };