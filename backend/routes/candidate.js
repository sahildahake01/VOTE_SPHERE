const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
    getProfile,
    updateProfile,
    getDashboard,
    getRankings
} = require('../controllers/candidateController');

const router = express.Router();

router.use(authenticateToken, requireRole(['candidate']));

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.get('/dashboard', getDashboard);
router.get('/rankings', getRankings);

module.exports = router;