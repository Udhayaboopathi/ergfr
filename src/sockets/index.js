'use strict';

const socketService = require('../services/socket.service');

/**
 * Initialize Socket.IO with HTTP server
 * @param {Object} server - HTTP server instance
 * @returns {Object} Socket.IO instance
 */
const setupSocketIO = (server) => {
  return socketService.initialize(server);
};

module.exports = setupSocketIO;