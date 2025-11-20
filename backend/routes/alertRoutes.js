const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alertController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

router.get('/', alertController.getAlerts);
router.get('/child/:childId', alertController.getChildAlerts);
router.put('/:alertId/read', alertController.markAlertRead);
router.put('/:alertId/resolve', alertController.markAlertResolved);
router.get('/thresholds/:childId', alertController.getThresholds);
router.put('/thresholds/:childId', alertController.updateThresholds);

module.exports = router;
