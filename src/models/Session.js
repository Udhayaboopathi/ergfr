'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const sessionSchema = new Schema({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  joinAt: {
    type: Date,
    default: Date.now,
  },
  startAt: {
    type: Date,
  },
  endAt: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'ended'],
    default: 'waiting',
  },
  questionOrder: {
    type: [Schema.Types.ObjectId],
    ref: 'Question',
    default: [],
  },
  optionOrders: {
    type: Map,
    of: [Schema.Types.ObjectId],
    default: new Map(),
  },
  score: {
    type: Number,
    default: 0,
  },
  totalTimeMs: {
    type: Number,
    default: 0,
  },
  fullscreenExits: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true, // Automatically create createdAt and updatedAt
});

// Create unique compound index for one session per user per quiz
sessionSchema.index({ quizId: 1, userId: 1 }, { unique: true });

// Create indexes for common query patterns
sessionSchema.index({ quizId: 1, status: 1 });
sessionSchema.index({ userId: 1 });
sessionSchema.index({ status: 1 });

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session;