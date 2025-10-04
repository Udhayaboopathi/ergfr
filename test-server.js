'use strict';

const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/quiz-app')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Create Express app
const app = express();
app.use(express.json());

// Simple health route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Quiz API is running' });
});

// List quiz route
app.get('/api/quizzes', async (req, res) => {
  try {
    const quizzes = await mongoose.connection.db.collection('quizzes').find().toArray();
    res.json({ quizzes });
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});