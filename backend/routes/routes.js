const express = require('express');
const router = express.Router();
const routeController = require('../controllers/routeController');
const authenticate = require('../middleware/auth');
const role = require('../middleware/role');

router.use(authenticate);
router.use(role('agency'));

router.get('/', routeController.getRoutes);
router.post('/', routeController.createRoute);
router.put('/:id', routeController.updateRoute);
router.delete('/:id', routeController.deleteRoute);

module.exports = router;
