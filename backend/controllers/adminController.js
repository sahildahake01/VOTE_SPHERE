const pool = require('../config/database');
const { User, Candidate, Vote, Election } = require('../models/db');
const { sendEmail } = require('../config/mailer');

const getDashboardStats = async (req, res) => {
    try {
        const [voterStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN is_verified = TRUE THEN 1 ELSE 0 END) as verified,
                SUM(CASE WHEN is_voted = TRUE THEN 1 ELSE 0 END) as voted
             FROM users WHERE role = 'voter'`
        );

        const [candidateStats] = await pool.execute(
            `SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN u.is_verified = TRUE THEN 1 ELSE 0 END) as verified
             FROM candidates c
             JOIN users u ON c.user_id = u.id`
        );

        const [voteCount] = await pool.execute('SELECT COUNT(*) as total FROM votes');
        const election = await Election.getStatus();

        res.json({
            voters: voterStats[0],
            candidates: candidateStats[0],
            votes: { total: voteCount[0].total },
            election
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const [voters] = await pool.execute(
            `SELECT id, email, is_verified, is_voted, created_at 
             FROM users WHERE role = 'voter' 
             ORDER BY created_at DESC`
        );

        const [candidates] = await pool.execute(
            `SELECT u.id, u.email, u.is_verified, u.created_at,
                    c.name, c.position, c.vote_count
             FROM users u
             JOIN candidates c ON u.id = c.user_id
             WHERE u.role = 'candidate'
             ORDER BY u.created_at DESC`
        );

        res.json({ voters, candidates });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyUser = async (req, res) => {
    try {
        const { userId, status } = req.body;

        const [user] = await pool.execute('SELECT email, role FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        await User.updateVerification(userId, status);

        // Send email notification
        const subject = status ? 'Account Verified' : 'Account Verification Update';
        const message = status
            ? 'Your account has been verified. You can now log in and participate.'
            : 'Your account verification request has been reviewed. Please contact admin for details.';
        await sendEmail(user[0].email, subject, `<h3>${subject}</h3><p>${message}</p>`);

        res.json({ message: `User ${status ? 'verified' : 'rejected'} successfully` });
    } catch (error) {
        console.error('Verify user error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const toggleElection = async (req, res) => {
    try {
        const { action } = req.body;

        if (action === 'start') {
            await Election.start();
            res.json({ message: 'Election started successfully' });
        } else if (action === 'end') {
            await Election.end();
            res.json({ message: 'Election ended successfully' });
        } else {
            res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Toggle election error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getResults = async (req, res) => {
    try {
        const results = await Vote.getResults();
        res.json({ results });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const sendResultsEmail = async (req, res) => {
    try {
        const results = await Vote.getResults();
        const election = await Election.getStatus();

        const [candidates] = await pool.execute(
            `SELECT u.email, c.name 
             FROM candidates c
             JOIN users u ON c.user_id = u.id
             WHERE u.is_verified = TRUE`
        );

        let html = `<h1>Election Results</h1>
                    <p>Election ended on: ${new Date(election.ended_at).toLocaleString()}</p>
                    <table border="1" cellpadding="8">
                    <tr><th>Candidate</th><th>Position</th><th>Total Votes</th></tr>`;

        for (const r of results) {
            html += `<tr><td>${r.name}</td><td>${r.position}</td><td>${r.total_votes}</td></tr>`;
        }
        html += `</table>`;

        let sentCount = 0;
        for (const candidate of candidates) {
            const success = await sendEmail(candidate.email, 'Election Results', html);
            if (success) sentCount++;
        }

        res.json({ message: `Results sent to ${sentCount} candidates` });
    } catch (error) {
        console.error('Send results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    getDashboardStats,
    getAllUsers,
    verifyUser,
    toggleElection,
    getResults,
    sendResultsEmail
};