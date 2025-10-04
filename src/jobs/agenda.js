'use strict';

const Agenda = require('agenda');
const logger = require('../utils/logger');

let agenda;

/**
 * Set up Agenda job scheduler
 * @returns {Promise<Agenda>} Agenda instance
 */
const setupAgenda = async () => {
  if (agenda) {
    return agenda;
  }

  const mongoURI = process.env.MONGO_URI;
  if (!mongoURI) {
    throw new Error('MONGO_URI environment variable is not defined');
  }

  agenda = new Agenda({
    db: { address: mongoURI, collection: 'agendaJobs' },
    processEvery: '30 seconds',
    maxConcurrency: 20,
  });

  // Define jobs
  require('./email.job')(agenda);

  // Handle events
  agenda.on('ready', () => logger.info('Agenda job scheduler is ready'));
  agenda.on('error', (err) => logger.error('Agenda error:', err));

  // Start processing jobs
  await agenda.start();
  logger.info('Agenda job processing has started');

  return agenda;
};

/**
 * Gracefully stop agenda
 * @returns {Promise<void>}
 */
const stopAgenda = async () => {
  if (agenda) {
    await agenda.stop();
    logger.info('Agenda job processing has stopped');
  }
};

module.exports = {
  setupAgenda,
  stopAgenda,
  getAgenda: () => agenda
};