'use strict';

const pino = require('pino');

// Configure logger options
const loggerOptions = {
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
};

// Add pretty printing for development
if (process.env.NODE_ENV !== 'production') {
  try {
    // Check if pino-pretty is available
    require.resolve('pino-pretty');
    loggerOptions.transport = {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:standard'
      }
    };
  } catch (e) {
    // pino-pretty not available, use default formatting
    console.warn('pino-pretty not available, using default log format');
  }
}

const logger = pino(loggerOptions);

module.exports = logger;