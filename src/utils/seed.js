'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const { User, Quiz, Question } = require('../models');
const { connectDB } = require('../config/database');
const logger = require('../utils/logger');

// Sample quiz questions
const sampleQuestions = [
  {
    text: 'What is the capital of France?',
    options: [
      { text: 'Paris' },
      { text: 'London' },
      { text: 'Berlin' },
      { text: 'Rome' }
    ],
    correctOptionIndex: 0
  },
  {
    text: 'Which planet is known as the Red Planet?',
    options: [
      { text: 'Earth' },
      { text: 'Mars' },
      { text: 'Jupiter' },
      { text: 'Venus' }
    ],
    correctOptionIndex: 1
  },
  {
    text: 'Who wrote the play "Romeo and Juliet"?',
    options: [
      { text: 'Charles Dickens' },
      { text: 'Jane Austen' },
      { text: 'William Shakespeare' },
      { text: 'Leo Tolstoy' }
    ],
    correctOptionIndex: 2
  },
  {
    text: 'What is the chemical symbol for gold?',
    options: [
      { text: 'Go' },
      { text: 'Gd' },
      { text: 'Au' },
      { text: 'Ag' }
    ],
    correctOptionIndex: 2
  },
  {
    text: 'Which programming language is this quiz application built with?',
    options: [
      { text: 'Python' },
      { text: 'JavaScript/Node.js' },
      { text: 'Java' },
      { text: 'C#' }
    ],
    correctOptionIndex: 1
  }
];

/**
 * Seed database with initial data
 */
const seedDatabase = async () => {
  try {
    // Check environment variables
    const requiredEnvVars = ['MONGO_URI', 'ADMIN_EMAIL'];
    for (const envVar of requiredEnvVars) {
      if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is not set`);
      }
    }

    // Connect to MongoDB
    logger.info('Connecting to MongoDB...');
    await connectDB();

    // Check if admin password hash is set or create one
    if (!process.env.ADMIN_PASSWORD_HASH) {
      // Use default password for development
      const defaultAdminPassword = 'admin123';
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(defaultAdminPassword, saltRounds);
      process.env.ADMIN_PASSWORD_HASH = passwordHash;
      
      logger.warn('ADMIN_PASSWORD_HASH not set. Using default password. DO NOT USE IN PRODUCTION!');
      logger.info(`Default admin password: "${defaultAdminPassword}"`);
      logger.info(`Generated password hash: ${passwordHash}`);
      logger.info('Add this hash to your .env file as ADMIN_PASSWORD_HASH=<hash>');
    }

    // Check if admin user exists
    const adminEmail = process.env.ADMIN_EMAIL;
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      // Create admin user
      adminUser = await User.create({
        name: 'Admin',
        teamName: 'Admin Team',
        email: adminEmail
      });
      logger.info(`Admin user created with email: ${adminEmail}`);
    } else {
      logger.info(`Admin user already exists with email: ${adminEmail}`);
    }

    // Create a sample quiz
    const existingQuiz = await Quiz.findOne({ title: 'Sample Quiz' });
    
    if (!existingQuiz) {
      const quiz = await Quiz.create({
        title: 'Sample Quiz',
        durationSeconds: 300, // 5 minutes
        status: 'draft',
        config: {
          shuffleQuestions: true,
          shuffleOptions: true,
          pointsPerCorrect: 1
        }
      });
      
      logger.info(`Sample quiz created with ID: ${quiz._id}`);
      
      // Add questions to the quiz
      for (const questionData of sampleQuestions) {
        // Create question document without setting correctOptionId yet
        const question = new Question({
          quizId: quiz._id,
          text: questionData.text,
          options: questionData.options.map(opt => ({ text: opt.text }))
        });
        
        // Now we can access the _id of the correct option after they've been created by Mongoose
        const correctOptionId = question.options[questionData.correctOptionIndex]._id;
        question.correctOptionId = correctOptionId;
        
        // Save the question
        await question.save();
        
        logger.info(`Added question: "${questionData.text}"`);
      }
      
      logger.info(`Added ${sampleQuestions.length} questions to the sample quiz`);
    } else {
      logger.info('Sample quiz already exists');
    }

    logger.info('Database seeding completed successfully');
  } catch (error) {
    logger.error('Database seeding failed:', error);
    throw error;
  } finally {
    // Close the connection
    await mongoose.connection.close();
    logger.info('Database connection closed');
  }
};

// Execute seeding if run directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = seedDatabase;