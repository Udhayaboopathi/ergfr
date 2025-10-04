'use strict';

const { asyncHandler, createError } = require('../utils/helpers');
const sessionService = require('../services/session.service');
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const { setupAgenda } = require('../jobs/agenda');

/**
 * Join a quiz as a participant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const join = asyncHandler(async (req, res) => {
  const { quizId, name, teamName, email } = req.body;
  
  // Create session or get existing one
  const session = await sessionService.createSession(quizId, name, teamName, email);
  
  res.status(200).json({
    success: true,
    sessionId: session._id,
    quizId: session.quizId,
    user: {
      name: session.user.name,
      teamName: session.user.teamName,
      email: session.user.email
    }
  });
});

/**
 * Get server time for client synchronization
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getServerTime = asyncHandler(async (req, res) => {
  res.status(200).json({
    now: Date.now()
  });
});

/**
 * Health check endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const healthCheck = asyncHandler(async (req, res) => {
  // Check database connection
  let dbStatus = 'disconnected';
  if (mongoose.connection.readyState === 1) {
    dbStatus = 'connected';
  } else if (mongoose.connection.readyState === 2) {
    dbStatus = 'connecting';
  }

  // Check job queue (Agenda) status
  let queueStatus = 'unavailable';
  try {
    const agenda = await setupAgenda();
    if (agenda) {
      queueStatus = 'connected';
    }
  } catch (error) {
    queueStatus = 'error';
  }

  res.status(200).json({
    status: 'ok',
    service: 'quiz-api',
    db: dbStatus,
    queue: queueStatus,
    timestamp: Date.now(),
  });
});

module.exports = {
  join,
  getServerTime,
  healthCheck
};