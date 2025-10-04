'use strict';

const { EmailJob } = require('../models');
const { getAgenda } = require('../jobs/agenda');
const logger = require('../utils/logger');

/**
 * Queue an email job to send quiz results to a participant
 * @param {string} quizId - Quiz ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Created email job document
 */
const queueResultsEmail = async (quizId, sessionId) => {
  try {
    // Create email job record
    const emailJob = await EmailJob.create({
      quizId,
      sessionId,
      status: 'queued'
    });

    // Schedule the job
    const agenda = getAgenda();
    if (!agenda) {
      throw new Error('Agenda not initialized');
    }

    await agenda.schedule('in 5 seconds', 'send result email', { 
      emailJobId: emailJob._id 
    });

    logger.info(`Result email queued for session ${sessionId}`);
    return emailJob;
  } catch (error) {
    logger.error('Failed to queue result email:', error);
    throw error;
  }
};

module.exports = {
  queueResultsEmail
};