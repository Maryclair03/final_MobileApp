const express = require('express');
const router = express.Router();
const vitalsController = require('../controllers/vitalsController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

router.post('/', vitalsController.addVitalReading);
router.get('/:childId/latest', vitalsController.getLatestVitals);
router.get('/:childId/history', vitalsController.getVitalsHistory);
router.get('/:childId/stats', vitalsController.getVitalStats);

module.exports = router;
