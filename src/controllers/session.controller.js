'use strict';

const { asyncHandler, createError } = require('../utils/helpers');
const { Session, Question, Answer, EventLog } = require('../models');
const quizController = require('./quiz.controller');
const socketService = require('../services/socket.service');

/**
 * Get the next question for a session
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getNextQuestion = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  
  // Find session
  const session = await Session.findById(sessionId);
  if (!session) {
    throw createError(`Session with ID ${sessionId} not found`, 404);
  }
  
  // Check if session is active
  if (session.status !== 'active') {
    return res.status(200).json({
      success: true,
      done: true,
      message: `Session is ${session.status}`,
    });
  }
  
  // Get answered questions for this session
  const answeredQuestionIds = await Answer.find({ sessionId })
    .distinct('questionId')
    .lean();
  
  // Convert to string for comparison
  const answeredIds = answeredQuestionIds.map(id => id.toString());
  
  // Find next unanswered question from the session's question order
  const nextQuestionId = session.questionOrder.find(qId => 
    !answeredIds.includes(qId.toString())
  );
  
  // If no more questions, return done flag
  if (!nextQuestionId) {
    return res.status(200).json({
      success: true,
      done: true,
    });
  }
  
  // Get question details
  const question = await Question.findById(nextQuestionId);
  if (!question) {
    throw createError('Question not found', 404);
  }
  
  // Get option order for this question from the session
  const optionOrderMap = session.optionOrders || {};
  const optionOrder = optionOrderMap[nextQuestionId.toString()] || [];
  
  // Create options array with shuffled order (no correct answer info)
  const options = optionOrder.map(optionId => {
    const option = question.options.id(optionId);
    return {
      optionId: option._id,
      text: option.text
    };
  });
  
  res.status(200).json({
    success: true,
    questionId: question._id,
    text: question.text,
    options
  });
});

/**
 * Submit an answer for a question
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitAnswer = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { questionId, selectedOptionId, timeTakenMs } = req.body;
  
  // Find session
  const session = await Session.findById(sessionId);
  if (!session) {
    throw createError(`Session with ID ${sessionId} not found`, 404);
  }
  
  // Check if session is active
  if (session.status !== 'active') {
    throw createError(`Cannot submit answer for ${session.status} session`, 400);
  }
  
  // Check if question belongs to this session's quiz
  const question = await Question.findOne({ _id: questionId, quizId: session.quizId });
  if (!question) {
    throw createError('Question not found or does not belong to this quiz', 404);
  }
  
  // Check if question is in session's question order
  if (!session.questionOrder.includes(questionId)) {
    throw createError('Question not in session question order', 400);
  }
  
  // Check if question has already been answered
  const existingAnswer = await Answer.findOne({ sessionId, questionId });
  if (existingAnswer) {
    throw createError('This question has already been answered', 400);
  }
  
  // Determine if answer is correct
  const isCorrect = question.correctOptionId.toString() === selectedOptionId.toString();
  
  // Create answer record
  const answer = await Answer.create({
    sessionId,
    quizId: session.quizId,
    questionId,
    selectedOptionId,
    isCorrect,
    timeTakenMs
  });
  
  // Update session score and time
  if (isCorrect) {
    // Get quiz for points per correct
    const Quiz = require('../models/Quiz');
    const quiz = await Quiz.findById(session.quizId);
    const pointsPerCorrect = quiz?.config?.pointsPerCorrect || 1;
    
    session.score += pointsPerCorrect;
  }
  
  session.totalTimeMs += timeTakenMs;
  await session.save();
  
  // Emit progress to admins
  const answeredCount = await Answer.countDocuments({ sessionId });
  const totalQuestions = session.questionOrder.length;
  
  socketService.emitToAdmins(session.quizId, 'server:progress', {
    sessionId,
    answeredCount,
    totalQuestions
  });
  
  // Update ranking for admins
  await quizController.updateRanking(session.quizId);
  
  // Return answer result (but not the correct answer)
  res.status(200).json({
    success: true,
    correct: isCorrect
  });
});

/**
 * Log an event from the client
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logEvent = asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { type } = req.body;
  
  // Find session
  const session = await Session.findById(sessionId);
  if (!session) {
    throw createError(`Session with ID ${sessionId} not found`, 404);
  }
  
  // Create event log
  const eventLog = await EventLog.create({
    sessionId,
    quizId: session.quizId,
    type,
    at: new Date()
  });
  
  // If fullscreen exit, increment counter in session
  if (type === 'fullscreen_exit') {
    session.fullscreenExits += 1;
    await session.save();
    
    // Update ranking if active quiz
    if (session.status === 'active') {
      await quizController.updateRanking(session.quizId);
    }
  }
  
  res.status(200).json({
    success: true,
    eventId: eventLog._id
  });
});

module.exports = {
  getNextQuestion,
  submitAnswer,
  logEvent
};