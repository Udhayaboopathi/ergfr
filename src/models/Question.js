'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const optionSchema = new Schema({
  text: {
    type: String,
    required: true,
    trim: true,
  },
}, {
  _id: true, // Enable automatic _id generation for options
});

const questionSchema = new Schema({
  quizId: {
    type: Schema.Types.ObjectId,
    ref: 'Quiz',
    required: true,
  },
  text: {
    type: String,
    required: true,
    trim: true,
  },
  options: {
    type: [optionSchema],
    validate: [
      {
        validator: function(options) {
          // Must have at least 2 options
          return options && options.length >= 2;
        },
        message: 'Question must have at least 2 options',
      },
      {
        validator: function(options) {
          // Must have no more than 8 options
          return options && options.length <= 8;
        },
        message: 'Question cannot have more than 8 options',
      },
    ],
  },
  correctOptionId: {
    type: Schema.Types.ObjectId,
    required: true,
    validate: {
      validator: function(correctOptionId) {
        // correctOptionId must exist within the options array
        if (!this.options || this.options.length === 0) return false;
        return this.options.some(option => option._id.toString() === correctOptionId.toString());
      },
      message: 'Correct option ID must match one of the provided options',
    },
  },
}, {
  timestamps: true, // Automatically create createdAt and updatedAt
});

// Create indexes for common query patterns
questionSchema.index({ quizId: 1 });

const Question = mongoose.model('Question', questionSchema);

module.exports = Question;