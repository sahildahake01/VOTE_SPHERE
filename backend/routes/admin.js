const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const {
    getDashboardStats,
    getAllUsers,
    verifyUser,
    toggleElection,
    getResults,
    sendResultsEmail
} = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateToken, requireRole(['admin']));

router.get('/dashboard', getDashboardStats);
router.get('/users', getAllUsers);
router.post('/verify', verifyUser);
router.post('/election', toggleElection);
router.get('/results', getResults);
router.post('/send-results', sendResultsEmail);

module.exports = router;