'use strict';

const { asyncHandler, createError } = require('../utils/helpers');
const { Quiz, Question, Session, Answer, EventLog } = require('../models');
const mongoose = require('mongoose');
const csvParse = require('csv-parse/sync').parse;
const emailService = require('../services/email.service');
const socketService = require('../services/socket.service');

/**
 * Create a new quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createQuiz = asyncHandler(async (req, res) => {
  const { title, durationSeconds, config } = req.body;
  
  const quiz = await Quiz.create({
    title,
    durationSeconds,
    config,
    status: 'draft'
  });
  
  res.status(201).json({
    success: true,
    quiz
  });
});

/**
 * List all quizzes with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const listQuizzes = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  
  // Filter by status if provided
  const filter = {};
  if (req.query.status && ['draft', 'running', 'ended'].includes(req.query.status)) {
    filter.status = req.query.status;
  }
  
  // Count total quizzes for pagination
  const total = await Quiz.countDocuments(filter);
  
  // Get quizzes
  const quizzes = await Quiz.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
    
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    quizzes,
    pagination: {
      total,
      page,
      pages: totalPages,
      limit
    }
  });
});

/**
 * Get a specific quiz by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  // Get question count
  const questionCount = await Question.countDocuments({ quizId });
  
  res.status(200).json({
    success: true,
    quiz,
    questionCount
  });
});

/**
 * Add questions to a quiz (bulk upload)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addQuestions = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  let questions = req.body;
  
  // Validate quiz exists and is in draft status
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  if (quiz.status !== 'draft') {
    throw createError('Cannot add questions to a quiz that has started or ended', 400);
  }
  
  // Handle CSV upload (if content-type is text/csv)
  if (req.is('text/csv')) {
    try {
      // Parse CSV content
      const parsed = csvParse(req.body.toString(), {
        columns: true,
        skip_empty_lines: true
      });
      
      // Transform CSV data to question format
      questions = parsed.map(row => {
        // Extract options and correct option from CSV
        const options = [];
        let correctOptionId = null;
        
        // Assuming CSV has columns like option1, option2, etc. and a correctOption column
        for (let i = 1; i <= 8; i++) {
          const optionKey = `option${i}`;
          if (row[optionKey] && row[optionKey].trim()) {
            const optId = new mongoose.Types.ObjectId();
            options.push({
              _id: optId,
              text: row[optionKey].trim()
            });
            
            // If this is the correct option
            if (row.correctOption && parseInt(row.correctOption) === i) {
              correctOptionId = optId;
            }
          }
        }
        
        return {
          text: row.text.trim(),
          options,
          correctOptionId
        };
      });
    } catch (error) {
      throw createError(`Failed to parse CSV data: ${error.message}`, 400);
    }
  }
  
  // Add quizId to each question
  questions = questions.map(q => ({
    ...q,
    quizId
  }));
  
  // Create all questions
  const createdQuestions = await Question.insertMany(questions);
  
  res.status(201).json({
    success: true,
    count: createdQuestions.length,
    questions: createdQuestions
  });
});

/**
 * Get list of participants for a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getParticipants = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 50;
  const skip = (page - 1) * limit;
  
  // Validate quiz exists
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  // Get total count for pagination
  const total = await Session.countDocuments({ quizId });
  
  // Get participants with user details
  const sessions = await Session.find({ quizId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name teamName email');
  
  const participants = sessions.map(session => ({
    sessionId: session._id,
    name: session.userId.name,
    teamName: session.userId.teamName,
    email: session.userId.email,
    status: session.status,
    joinedAt: session.joinAt,
    startedAt: session.startAt,
    endedAt: session.endAt,
    score: session.score,
    fullscreenExits: session.fullscreenExits
  }));
  
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    participants,
    pagination: {
      total,
      page,
      pages: totalPages,
      limit
    }
  });
});

/**
 * Start a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const startQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  
  // Validate quiz exists and is in draft status
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  if (quiz.status === 'ended') {
    throw createError('Cannot start a quiz that has already ended', 400);
  }
  
  if (quiz.status === 'running') {
    // Quiz is already running, return the current state
    return res.status(200).json({
      success: true,
      message: 'Quiz is already running',
      quiz
    });
  }
  
  // Set start time to 1 second in the future
  const startAt = new Date(Date.now() + 1000);
  
  // Update quiz status to running
  quiz.status = 'running';
  quiz.startAt = startAt;
  await quiz.save();
  
  // Update all waiting sessions to active
  await Session.updateMany(
    { quizId, status: 'waiting' },
    { status: 'active', startAt }
  );
  
  // Notify participants via socket
  socketService.emitToQuiz(quizId, 'server:start', {
    startAt: startAt.getTime(),
    durationSeconds: quiz.durationSeconds
  });
  
  res.status(200).json({
    success: true,
    message: 'Quiz started successfully',
    quiz
  });
});

/**
 * End a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const endQuiz = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  
  // Validate quiz exists and is running
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  if (quiz.status === 'ended') {
    // Quiz is already ended, return the current state
    return res.status(200).json({
      success: true,
      message: 'Quiz is already ended',
      quiz
    });
  }
  
  if (quiz.status !== 'running') {
    throw createError('Cannot end a quiz that has not started', 400);
  }
  
  const endAt = new Date();
  
  // Update quiz status to ended
  quiz.status = 'ended';
  quiz.endAt = endAt;
  await quiz.save();
  
  // Get all active sessions
  const activeSessions = await Session.find({ quizId, status: 'active' });
  
  // Finalize all active sessions
  for (const session of activeSessions) {
    await finalizeSession(session._id, quiz);
  }
  
  // Notify participants via socket
  socketService.emitToQuiz(quizId, 'server:end', {});
  
  // Update ranking for admins
  await updateRanking(quizId);
  
  res.status(200).json({
    success: true,
    message: 'Quiz ended successfully',
    quiz
  });
});

/**
 * Get ranking for a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getRanking = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  
  // Validate quiz exists
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  const ranking = await calculateRanking(quizId);
  
  res.status(200).json({
    success: true,
    ranking
  });
});

/**
 * Get event logs for a quiz
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getLogs = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 100;
  const skip = (page - 1) * limit;
  
  // Validate quiz exists
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  // Get total count for pagination
  const total = await EventLog.countDocuments({ quizId });
  
  // Get logs with session user details
  const logs = await EventLog.find({ quizId })
    .sort({ at: -1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'sessionId',
      populate: {
        path: 'userId',
        select: 'name teamName email'
      }
    });
  
  const formattedLogs = logs.map(log => ({
    id: log._id,
    type: log.type,
    at: log.at,
    user: log.sessionId?.userId ? {
      name: log.sessionId.userId.name,
      teamName: log.sessionId.userId.teamName,
      email: log.sessionId.userId.email
    } : null
  }));
  
  const totalPages = Math.ceil(total / limit);
  
  res.status(200).json({
    success: true,
    logs: formattedLogs,
    pagination: {
      total,
      page,
      pages: totalPages,
      limit
    }
  });
});

/**
 * Export quiz results as CSV
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportResults = asyncHandler(async (req, res) => {
  const { quizId } = req.params;
  
  // Validate quiz exists and has ended
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }
  
  if (quiz.status !== 'ended') {
    throw createError('Cannot export results for a quiz that has not ended', 400);
  }
  
  // Get all sessions for this quiz
  const sessions = await Session.find({ quizId })
    .populate('userId', 'name teamName email');
  
  // Get all questions for this quiz
  const questions = await Question.find({ quizId });
  
  // Get all answers
  const answers = await Answer.find({ quizId });
  
  // Create CSV header
  let csvContent = 'Name,Team,Email,Score,TimeMs,FullscreenExits';
  
  // Add question headers
  questions.forEach((q, index) => {
    csvContent += `,Q${index+1},Q${index+1}_Correct`;
  });
  
  csvContent += '\n';
  
  // Add data rows
  for (const session of sessions) {
    const user = session.userId;
    const row = [
      `"${user.name}"`,
      `"${user.teamName}"`,
      `"${user.email}"`,
      session.score,
      session.totalTimeMs,
      session.fullscreenExits
    ];
    
    // Add answer data for each question
    for (const question of questions) {
      const answer = answers.find(a => 
        a.sessionId.toString() === session._id.toString() && 
        a.questionId.toString() === question._id.toString()
      );
      
      if (answer) {
        row.push(`"${getSelectedOptionText(question, answer.selectedOptionId)}"`);
        row.push(answer.isCorrect ? 'Yes' : 'No');
      } else {
        row.push('""');
        row.push('No');
      }
    }
    
    csvContent += row.join(',') + '\n';
  }
  
  // Set response headers for CSV download
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=quiz-${quizId}-results.csv`);
  
  res.status(200).send(csvContent);
});

/**
 * Helper function to get the text of a selected option
 * @param {Object} question - Question document
 * @param {string} optionId - Selected option ID
 * @returns {string} Option text
 */
const getSelectedOptionText = (question, optionId) => {
  const option = question.options.find(o => o._id.toString() === optionId.toString());
  return option ? option.text : 'Unknown Option';
};

/**
 * Helper function to calculate ranking
 * @param {string} quizId - Quiz ID
 * @returns {Array} Ranking array
 */
const calculateRanking = async (quizId) => {
  // Get all sessions for this quiz
  const sessions = await Session.find({ quizId })
    .populate('userId', 'name teamName email');
  
  // Create ranking data
  const ranking = sessions.map(session => ({
    sessionId: session._id,
    user: {
      name: session.userId.name,
      teamName: session.userId.teamName,
      email: session.userId.email
    },
    score: session.score,
    totalTimeMs: session.totalTimeMs,
    fullscreenExits: session.fullscreenExits,
    status: session.status
  }));
  
  // Sort by score (desc), then time (asc), then fullscreen exits (asc)
  ranking.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.totalTimeMs !== b.totalTimeMs) return a.totalTimeMs - b.totalTimeMs;
    return a.fullscreenExits - b.fullscreenExits;
  });
  
  return ranking;
};

/**
 * Helper function to update ranking via websockets
 * @param {string} quizId - Quiz ID
 */
const updateRanking = async (quizId) => {
  const ranking = await calculateRanking(quizId);
  socketService.emitToAdmins(quizId, 'server:rankingUpdate', ranking);
};

/**
 * Helper function to finalize a session when quiz ends
 * @param {string} sessionId - Session ID
 * @param {Object} quiz - Quiz document
 */
const finalizeSession = async (sessionId, quiz) => {
  const session = await Session.findById(sessionId);
  if (!session) return;
  
  // Mark session as ended
  session.status = 'ended';
  session.endAt = new Date();
  await session.save();
  
  // Queue email job
  await emailService.queueResultsEmail(quiz._id, session._id);
};

module.exports = {
  createQuiz,
  listQuizzes,
  getQuiz,
  addQuestions,
  getParticipants,
  startQuiz,
  endQuiz,
  getRanking,
  getLogs,
  exportResults,
  updateRanking // Export for use in other controllers
};