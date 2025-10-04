'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const quizSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  durationSeconds: {
    type: Number,
    required: true,
    min: 1,
  },
  status: {
    type: String,
    enum: ['draft', 'running', 'ended'],
    default: 'draft',
  },
  config: {
    shuffleQuestions: {
      type: Boolean,
      default: true,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    pointsPerCorrect: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  startAt: {
    type: Date,
  },
  endAt: {
    type: Date,
  },
}, {
  timestamps: true, // Automatically create createdAt and updatedAt
});

// Create indexes for common query patterns
quizSchema.index({ status: 1 });
quizSchema.index({ createdAt: -1 });

const Quiz = mongoose.model('Quiz', quizSchema);

module.exports = Quiz;