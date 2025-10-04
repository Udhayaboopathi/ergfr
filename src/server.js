'use strict';

require('dotenv').config();
const app = require('./app');
const http = require('http');
const socketSetup = require('./sockets');
const logger = require('./utils/logger');
const { connectDB } = require('./config/database');
const { setupAgenda } = require('./jobs/agenda');

const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

// Set up Socket.IO with the server
try {
  logger.info('Setting up Socket.IO...');
  socketSetup(server);
  logger.info('Socket.IO setup completed');
} catch (error) {
  logger.error('Error setting up Socket.IO:', error);
  // Continue without socket.io for testing
}

// Connect to MongoDB
connectDB()
  .then(() => {
    // Initialize Agenda job scheduler if not disabled
    if (process.env.DISABLE_AGENDA !== 'true') {
      return setupAgenda();
    }
    return Promise.resolve();
  })
  .then(() => {
    // Start the server
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`API Documentation available at /docs`);
    });
  })
  .catch((err) => {
    logger.error('Failed to start the server:', err);
    process.exit(1);
  });

// Handle uncaught exceptions and rejections
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  // Only exit if not in development mode
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  // Only exit if not in development mode
  if (process.env.NODE_ENV !== 'development') {
    process.exit(1);
  }
});

// Graceful shutdown
const shutdownGracefully = async () => {
  logger.info('Shutting down gracefully...');
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdownGracefully);
process.on('SIGINT', shutdownGracefully);