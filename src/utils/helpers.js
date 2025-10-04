'use strict';

/**
 * Fisher-Yates shuffle algorithm for randomizing arrays
 * @param {Array} array - The array to be shuffled
 * @returns {Array} - The shuffled array (modified in place)
 */
const shuffleArray = (array) => {
  const result = [...array]; // Create a copy to not mutate the original
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]; // Swap elements
  }
  return result;
};

/**
 * Generate error response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @returns {Error} Custom error object with status code
 */
const createError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Async handler to catch errors in async route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  shuffleArray,
  createError,
  asyncHandler
};