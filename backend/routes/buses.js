const express = require('express');
const router = express.Router();
const busController = require('../controllers/busController');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

router.use(authenticate);
router.use(role('agency'));

router.get('/', busController.getBuses);
router.post('/', busController.createBus);
router.put('/:id', busController.updateBus);
router.delete('/:id', busController.deleteBus);

module.exports = router;
