'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  teamName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a case-insensitive index on email
userSchema.index({ email: 1 }, { collation: { locale: 'en', strength: 2 } });

const User = mongoose.model('User', userSchema);

module.exports = User;