'use strict';

const { User, Quiz, Question, Session } = require('../models');
const { createError, shuffleArray } = require('../utils/helpers');

/**
 * Create or retrieve a user session for a quiz
 * @param {string} quizId - Quiz ID
 * @param {string} name - User's name
 * @param {string} teamName - User's team name
 * @param {string} email - User's email
 * @returns {Object} Session with user information
 */
const createSession = async (quizId, name, teamName, email) => {
  // Validate quiz exists and is not ended
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw createError(`Quiz with ID ${quizId} not found`, 404);
  }

  if (quiz.status === 'ended') {
    throw createError('This quiz has already ended', 400);
  }

  // Find or create user by email
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({
      name,
      teamName,
      email
    });
  } else {
    // Update name and teamName if user exists
    user.name = name;
    user.teamName = teamName;
    await user.save();
  }

  // Check if user already has a session for this quiz
  let session = await Session.findOne({ quizId, userId: user._id });
  
  if (session) {
    // Return existing session
    return { ...session.toObject(), user };
  }

  // Get all questions for this quiz
  const questions = await Question.find({ quizId });
  if (questions.length === 0) {
    throw createError('Cannot join quiz with no questions', 400);
  }

  // Create question and option orders based on quiz config
  let questionOrder = questions.map(q => q._id);
  if (quiz.config.shuffleQuestions) {
    questionOrder = shuffleArray(questionOrder);
  }

  // Create option orders for each question
  const optionOrders = new Map();
  for (const question of questions) {
    let optionOrder = question.options.map(o => o._id);
    if (quiz.config.shuffleOptions) {
      optionOrder = shuffleArray(optionOrder);
    }
    optionOrders.set(question._id.toString(), optionOrder);
  }

  // Create new session
  session = await Session.create({
    quizId,
    userId: user._id,
    status: 'waiting',
    questionOrder,
    optionOrders: Object.fromEntries(optionOrders),
  });

  return { ...session.toObject(), user };
};

module.exports = {
  createSession
};