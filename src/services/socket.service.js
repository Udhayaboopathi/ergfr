'use strict';

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const { Session, EventLog } = require('../models');

// Socket.IO server instance
let io;

/**
 * Initialize Socket.IO with HTTP server
 * @param {Object} server - HTTP server instance
 */
const initialize = (server) => {
  // Create Socket.IO server
  io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' 
        ? process.env.ALLOWED_ORIGINS?.split(',') || process.env.APP_BASE_URL
        : '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // For large-scale deployment, we could use a custom adapter (e.g., Redis)
    // adapter: createAdapter(process.env.REDIS_URI)
  });

  // Set up middleware
  io.use((socket, next) => {
    // Add rate limiting for production
    if (process.env.NODE_ENV === 'production') {
      // Implementation would depend on the adapter being used
    }
    next();
  });

  // Create namespace for each quiz dynamically
  io.on('connection', (socket) => {
    logger.debug(`Socket connected: ${socket.id}`);
    
    // Handle user joining a quiz
    socket.on('user:join', async (data) => {
      try {
        const { sessionId } = data;
        if (!sessionId) {
          return socket.emit('error', { message: 'Session ID is required' });
        }

        // Find session
        const session = await Session.findById(sessionId);
        if (!session) {
          return socket.emit('error', { message: 'Invalid session' });
        }

        // Join quiz room
        const quizRoom = session.quizId.toString();
        socket.join(quizRoom);
        logger.debug(`User joined quiz ${quizRoom} with session ${sessionId}`);

        // Add session ID to socket data for future reference
        socket.data.sessionId = sessionId;
        socket.data.quizId = quizRoom;

        socket.emit('joined', { quizId: quizRoom });
      } catch (error) {
        logger.error('Error in user:join handler:', error);
        socket.emit('error', { message: 'Failed to join quiz' });
      }
    });

    // Handle user events (e.g., fullscreen exit)
    socket.on('user:event', async (data) => {
      try {
        const { type } = data;
        const sessionId = socket.data.sessionId;
        
        if (!sessionId) {
          return socket.emit('error', { message: 'Not joined to a quiz' });
        }

        // Find session
        const session = await Session.findById(sessionId);
        if (!session) {
          return socket.emit('error', { message: 'Invalid session' });
        }

        // Create event log
        await EventLog.create({
          sessionId,
          quizId: session.quizId,
          type,
          at: new Date()
        });

        // If fullscreen exit, increment counter in session
        if (type === 'fullscreen_exit') {
          session.fullscreenExits += 1;
          await session.save();
        }
      } catch (error) {
        logger.error('Error in user:event handler:', error);
        socket.emit('error', { message: 'Failed to log event' });
      }
    });

    // Handle user submitting answer (alternative to REST API)
    socket.on('user:answer', async (data) => {
      try {
        const { questionId, selectedOptionId, timeTakenMs } = data;
        const sessionId = socket.data.sessionId;
        
        if (!sessionId) {
          return socket.emit('error', { message: 'Not joined to a quiz' });
        }

        // Use the same logic as in session controller
        const response = await fetch(`${process.env.APP_BASE_URL}/api/sessions/${sessionId}/answers`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            questionId,
            selectedOptionId,
            timeTakenMs
          }),
        });

        const result = await response.json();
        
        if (result.success) {
          socket.emit('answer:result', { correct: result.correct });
        } else {
          socket.emit('error', { message: result.message });
        }
      } catch (error) {
        logger.error('Error in user:answer handler:', error);
        socket.emit('error', { message: 'Failed to submit answer' });
      }
    });

    // Handle admin joining
    socket.on('admin:join', async (data) => {
      try {
        const { quizId, token } = data;
        
        if (!quizId) {
          return socket.emit('error', { message: 'Quiz ID is required' });
        }

        // Verify admin token
        if (!token) {
          return socket.emit('error', { message: 'Authentication required' });
        }

        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (!decoded || !decoded.email || decoded.email !== process.env.ADMIN_EMAIL) {
            return socket.emit('error', { message: 'Unauthorized' });
          }
        } catch (error) {
          return socket.emit('error', { message: 'Invalid token' });
        }

        // Join quiz admin room
        const adminRoom = `admin:${quizId}`;
        socket.join(adminRoom);
        socket.data.isAdmin = true;
        socket.data.quizId = quizId;
        
        logger.debug(`Admin joined quiz ${quizId} admin room`);
        
        // Send current participants list
        const sessions = await Session.find({ quizId })
          .populate('userId', 'name teamName email');
        
        const participants = sessions.map(session => ({
          sessionId: session._id,
          name: session.userId.name,
          teamName: session.userId.teamName,
          email: session.userId.email,
          status: session.status
        }));
        
        socket.emit('server:joinedUsers', participants);
      } catch (error) {
        logger.error('Error in admin:join handler:', error);
        socket.emit('error', { message: 'Failed to join as admin' });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      logger.debug(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

/**
 * Emit event to all users in a quiz room
 * @param {string} quizId - Quiz ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToQuiz = (quizId, event, data) => {
  if (!io) {
    logger.error('Socket.IO not initialized');
    return;
  }
  
  io.to(quizId.toString()).emit(event, data);
};

/**
 * Emit event to admin room for a quiz
 * @param {string} quizId - Quiz ID
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
const emitToAdmins = (quizId, event, data) => {
  if (!io) {
    logger.error('Socket.IO not initialized');
    return;
  }
  
  io.to(`admin:${quizId.toString()}`).emit(event, data);
};

module.exports = {
  initialize,
  emitToQuiz,
  emitToAdmins
};