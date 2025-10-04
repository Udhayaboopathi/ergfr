'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { createError } = require('../utils/helpers');

/**
 * Generate a JWT token for an admin user
 * @param {string} email - Admin email
 * @returns {string} JWT token
 */
const generateToken = (email) => {
  return jwt.sign(
    { email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRY || '24h'
    }
  );
};

/**
 * Authenticate admin credentials
 * @param {string} email - Admin email
 * @param {string} password - Admin password
 * @returns {Promise<string>} JWT token if authentication successful
 * @throws {Error} If authentication fails
 */
const authenticateAdmin = async (email, password) => {
  // Check if email matches admin email
  if (email !== process.env.ADMIN_EMAIL) {
    throw createError('Invalid credentials', 401);
  }

  // Check if password hash matches
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH;
  if (!adminPasswordHash) {
    throw createError('Admin password hash not configured', 500);
  }

  const isMatch = await bcrypt.compare(password, adminPasswordHash);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  // Generate and return JWT token
  return generateToken(email);
};

module.exports = {
  generateToken,
  authenticateAdmin
};