'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const emailJobSchema = new Schema({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  sessionId: {
    type: Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  status: {
    type: String,
    enum: ['queued', 'sent', 'failed'],
    default: 'queued',
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastTriedAt: {
    type: Date,
  },
  error: {
    type: String,
  },
}, {
  timestamps: true, // Automatically create createdAt and updatedAt
});

// Create indexes for common query patterns
emailJobSchema.index({ quizId: 1 });
emailJobSchema.index({ sessionId: 1 });
emailJobSchema.index({ status: 1 });
emailJobSchema.index({ createdAt: 1 });

const EmailJob = mongoose.model('EmailJob', emailJobSchema);

module.exports = EmailJob;