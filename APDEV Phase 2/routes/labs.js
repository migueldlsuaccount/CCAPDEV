const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { requireAuth } = require('../middleware/auth');

router.get('/', requireAuth, labController.getLabs);
router.get('/:id', requireAuth, labController.getLabById);

module.exports = router;
