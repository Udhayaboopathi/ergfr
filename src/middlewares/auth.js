'use strict';

const jwt = require('jsonwebtoken');
const { createError } = require('../utils/helpers');

const authenticateJWT = (req, res, next) => {
  try {
    // Get auth header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Unauthorized - No token provided', 401);
    }
    
    // Extract token
    const token = authHeader.split(' ')[1];
    if (!token) {
      throw createError('Unauthorized - Invalid token format', 401);
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.email || decoded.email !== process.env.ADMIN_EMAIL) {
      throw createError('Unauthorized - Invalid token', 401);
    }
    
    // Attach decoded token to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      next(createError('Unauthorized - Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

module.exports = authenticateJWT;