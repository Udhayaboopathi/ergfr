'use strict';

const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/session.controller');
const { validateRequest, answerSchema, eventSchema } = require('../middlewares/validation');

// Get the next question for a session
router.get('/:sessionId/next', sessionController.getNextQuestion);

// Submit an answer for a question
router.post('/:sessionId/answers', validateRequest(answerSchema), sessionController.submitAnswer);

// Log client-side events (e.g., fullscreen exit)
router.post('/:sessionId/events', validateRequest(eventSchema), sessionController.logEvent);

module.exports = router;