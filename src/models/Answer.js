'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const answerSchema = new Schema({
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  questionId: {
    type: Schema.Types.ObjectId,
    ref: 'Question',
    required: true,
  },
  selectedOptionId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  isCorrect: {
    type: Boolean,
    required: true,
  },
  answeredAt: {
    type: Date,
    default: Date.now,
  },
  timeTakenMs: {
    type: Number,
    required: true,
  },
}, {
  timestamps: true, // Automatically create createdAt and updatedAt
});

// Create unique compound index to prevent duplicate answers
answerSchema.index({ quizId: 1, sessionId: 1, questionId: 1 }, { unique: true });

// Create indexes for common query patterns
answerSchema.index({ sessionId: 1 });
answerSchema.index({ quizId: 1 });

const Answer = mongoose.model('Answer', answerSchema);

module.exports = Answer;