const express = require('express');
const router = express.Router();
const scheduleController = require('../controllers/scheduleController');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

// Agency protected routes
router.get('/', authenticate, role('agency'), scheduleController.getSchedules);
router.post('/', authenticate, role('agency'), scheduleController.createSchedule);
router.put('/:id', authenticate, role('agency'), scheduleController.updateSchedule);
router.delete('/:id', authenticate, role('agency'), scheduleController.deleteSchedule);

module.exports = router;
