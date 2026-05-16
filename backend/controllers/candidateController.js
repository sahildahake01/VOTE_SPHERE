const pool = require('../config/database');
const { Candidate, Vote, Election } = require('../models/db');

const getProfile = async (req, res) => {
    try {
        const profile = await Candidate.findByUserId(req.user.id);
        if (!profile) {
            return res.status(404).json({ message: 'Candidate profile not found' });
        }

        const actualVotes = await Vote.getCountByCandidate(profile.id);
        const totalVotes = profile.vote_count + actualVotes;

        res.json({
            ...profile,
            actualVotes,
            totalVotes,
            voteCount: totalVotes
        });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { name, position, bio, photoUrl } = req.body;
        const success = await Candidate.update(req.user.id, { name, position, bio, photoUrl });

        if (!success) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getDashboard = async (req, res) => {
    try {
        const profile = await Candidate.findByUserId(req.user.id);
        if (!profile) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        const actualVotes = await Vote.getCountByCandidate(profile.id);
        const totalVotes = profile.vote_count + actualVotes;
        const election = await Election.getStatus();

        // Get rankings
        const [rankings] = await pool.execute(`
            SELECT 
                c.id,
                c.name,
                c.vote_count + COALESCE(COUNT(v.id), 0) as total_votes,
                RANK() OVER (ORDER BY (c.vote_count + COALESCE(COUNT(v.id), 0)) DESC) as rank
            FROM candidates c
            LEFT JOIN votes v ON c.id = v.candidate_id
            WHERE EXISTS (SELECT 1 FROM users u WHERE u.id = c.user_id AND u.is_verified = TRUE)
            GROUP BY c.id
            ORDER BY total_votes DESC
        `);

        const myRank = rankings.find(r => r.id === profile.id)?.rank || 'N/A';
        const totalCandidates = rankings.length;

        res.json({
            profile: {
                ...profile,
                actualVotes,
                totalVotes
            },
            election,
            rank: myRank,
            totalCandidates
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getRankings = async (req, res) => {
    try {
        const results = await Vote.getResults();
        res.json(results);
    } catch (error) {
        console.error('Rankings error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getProfile, updateProfile, getDashboard, getRankings };