const pool = require('../config/database');
const { Candidate, Vote, Election } = require('../models/db');

const getCandidates = async (req, res) => {
    try {
        const candidates = await Candidate.getAllVerified();
        res.json(candidates);
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const castVote = async (req, res) => {
    try {
        const voterId = req.user.id;
        const { candidateId } = req.body;

        // Check election status
        const election = await Election.getStatus();
        if (!election.is_active) {
            return res.status(403).json({ message: 'Voting is not active' });
        }

        // Check if already voted
        const hasVoted = await Vote.hasVoted(voterId);
        if (hasVoted) {
            return res.status(400).json({ message: 'You have already cast your vote' });
        }

        // Verify candidate exists and is verified
        const [candidate] = await pool.execute(
            `SELECT c.id FROM candidates c
             JOIN users u ON c.user_id = u.id
             WHERE c.id = ? AND u.is_verified = TRUE`,
            [candidateId]
        );
        if (candidate.length === 0) {
            return res.status(404).json({ message: 'Candidate not found' });
        }

        // Record vote
        await Vote.create(voterId, candidateId);
        await Candidate.incrementVotes(candidateId);
        await pool.execute('UPDATE users SET is_voted = TRUE WHERE id = ?', [voterId]);

        res.json({ message: 'Vote cast successfully!' });
    } catch (error) {
        console.error('Cast vote error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getVotingStatus = async (req, res) => {
    try {
        const hasVoted = await Vote.hasVoted(req.user.id);
        const election = await Election.getStatus();

        res.json({
            hasVoted,
            electionActive: election.is_active,
            electionEnded: election.ended_at !== null && !election.is_active
        });
    } catch (error) {
        console.error('Voting status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getResults = async (req, res) => {
    try {
        const results = await Vote.getResults();
        const election = await Election.getStatus();

        // Only show results if election ended
        if (election.is_active) {
            return res.status(403).json({ message: 'Results available only after election ends' });
        }

        res.json({ results, electionEndedAt: election.ended_at });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getCandidates, castVote, getVotingStatus, getResults };