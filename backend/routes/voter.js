const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
    getCandidates,
    castVote,
    getVotingStatus,
    getResults
} = require('../controllers/voterController');

const router = express.Router();

router.use(authenticateToken, requireRole(['voter']));

router.get('/candidates', getCandidates);
router.post('/vote', castVote);
router.get('/status', getVotingStatus);
router.get('/results', getResults);

module.exports = router;