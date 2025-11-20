const express = require('express');
const router = express.Router();
const childController = require('../controllers/childController');
const { authenticateToken } = require('../middleware/auth');

// All routes are protected
router.use(authenticateToken);

router.post('/', childController.addChild);
router.get('/', childController.getChildren);
router.get('/:childId', childController.getChild);
router.put('/:childId', childController.updateChild);
router.delete('/:childId', childController.deleteChild);

module.exports = router;
