'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const quizController = require('../controllers/quiz.controller');
const authenticateJWT = require('../middlewares/auth');
const { validateRequest, loginSchema, quizSchema, bulkQuestionsSchema } = require('../middlewares/validation');

// Admin authentication
router.post('/login', validateRequest(loginSchema), authController.login);

// Quiz management (all protected by JWT)
router.use(authenticateJWT);

router.post('/quizzes', validateRequest(quizSchema), quizController.createQuiz);
router.get('/quizzes', quizController.listQuizzes);
router.get('/quizzes/:quizId', quizController.getQuiz);

// Questions management
router.post('/quizzes/:quizId/questions', validateRequest(bulkQuestionsSchema), quizController.addQuestions);

// Quiz control
router.post('/quizzes/:quizId/start', quizController.startQuiz);
router.post('/quizzes/:quizId/end', quizController.endQuiz);

// Quiz data
router.get('/quizzes/:quizId/participants', quizController.getParticipants);
router.get('/quizzes/:quizId/ranking', quizController.getRanking);
router.get('/quizzes/:quizId/logs', quizController.getLogs);
router.get('/quizzes/:quizId/export', quizController.exportResults);

module.exports = router;