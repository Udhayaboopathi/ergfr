'use strict';

const { authenticateAdmin } = require('../services/auth.service');
const { asyncHandler } = require('../utils/helpers');

/**
 * Admin login controller
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} JWT token response
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const token = await authenticateAdmin(email, password);
  
  res.status(200).json({
    success: true,
    token
  });
});

module.exports = {
  login
};