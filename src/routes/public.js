'use strict';

const express = require('express');
const router = express.Router();
const publicController = require('../controllers/public.controller');
const { validateRequest, joinSchema } = require('../middlewares/validation');

// Join a quiz
router.post('/join', validateRequest(joinSchema), publicController.join);

// Get server time for synchronization
router.get('/time', publicController.getServerTime);

// Health check
router.get('/health', publicController.healthCheck);

module.exports = router;