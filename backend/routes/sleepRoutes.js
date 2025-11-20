const express = require('express');
const router = express.Router();
const sleepController = require('../controllers/sleepController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

router.post('/start', sleepController.startSleep);
router.put('/end/:sessionId', sleepController.endSleep);
router.get('/:childId/history', sleepController.getSleepHistory);
router.get('/:childId/stats', sleepController.getSleepStats);
router.get('/:childId/active', sleepController.getActiveSleep);

module.exports = router;
