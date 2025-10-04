'use strict';

const Joi = require('joi');
const { createError } = require('../utils/helpers');

/**
 * Middleware factory for validating request bodies with Joi schemas
 * @param {Object} schema - Joi schema for validation
 * @returns {Function} Express middleware function
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      
      return next(createError(errorMessage, 400));
    }

    // Replace req.body with validated value
    req.body = value;
    next();
  };
};

// Schema for user join request
const joinSchema = Joi.object({
  quizId: Joi.string().required(),
  name: Joi.string().trim().min(1).max(100).required(),
  teamName: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().email().required(),
});

// Schema for admin login
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Schema for quiz creation
const quizSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  durationSeconds: Joi.number().integer().min(30).required(),
  config: Joi.object({
    shuffleQuestions: Joi.boolean().default(true),
    shuffleOptions: Joi.boolean().default(true),
    pointsPerCorrect: Joi.number().integer().min(1).default(1),
  }).default(),
});

// Schema for question creation (single question)
const questionSchema = Joi.object({
  text: Joi.string().trim().min(1).required(),
  options: Joi.array()
    .items(
      Joi.object({
        text: Joi.string().trim().min(1).required(),
      })
    )
    .min(2)
    .max(8)
    .required(),
  correctOptionId: Joi.string().required(),
});

// Schema for bulk questions upload
const bulkQuestionsSchema = Joi.array().items(questionSchema).min(1);

// Schema for answer submission
const answerSchema = Joi.object({
  questionId: Joi.string().required(),
  selectedOptionId: Joi.string().required(),
  timeTakenMs: Joi.number().integer().min(0).required(),
});

// Schema for event logging
const eventSchema = Joi.object({
  type: Joi.string()
    .valid(
      'fullscreen_exit',
      'blur',
      'focus',
      'visibility_hidden',
      'visibility_visible',
      'rejoin'
    )
    .required(),
});

module.exports = {
  validateRequest,
  joinSchema,
  loginSchema,
  quizSchema,
  questionSchema,
  bulkQuestionsSchema,
  answerSchema,
  eventSchema,
};