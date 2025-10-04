'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventLogSchema = new Schema({
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
  type: {
    type: String,
    enum: [
      'fullscreen_exit',
      'blur',
      'focus',
      'visibility_hidden',
      'visibility_visible',
      'rejoin',
    ],
    required: true,
  },
  at: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Automatically create createdAt and updatedAt
});

// Create indexes for common query patterns
eventLogSchema.index({ quizId: 1 });
eventLogSchema.index({ sessionId: 1 });
eventLogSchema.index({ at: -1 });
eventLogSchema.index({ type: 1 });

const EventLog = mongoose.model('EventLog', eventLogSchema);

module.exports = EventLog;