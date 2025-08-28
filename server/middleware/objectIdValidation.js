const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Middleware to validate ObjectId parameters
 * @param {string} paramName - The name of the parameter to validate (default: 'id')
 * @returns {Function} Express middleware function
 */
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    // Check if parameter exists and is a string
    if (!id || typeof id !== 'string') {
      logger.error(`Invalid ${paramName} parameter:`, { 
        id, 
        type: typeof id
      });
      return res.status(400).json({ 
        message: `Invalid ${paramName} format. ${paramName} must be a string.` 
      });
    }

    // Check if it's 24 characters long
    if (id.length !== 24) {
      logger.error(`Invalid ${paramName} length:`, { 
        id, 
        length: id.length 
      });
      return res.status(400).json({ 
        message: `Invalid ${paramName} format. ${paramName} must be 24 characters long.` 
      });
    }

    // Check if it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      logger.error(`Invalid ObjectId format for ${paramName}:`, { id });
      return res.status(400).json({ 
        message: `Invalid ${paramName} format. ${paramName} must be a valid MongoDB ObjectId.` 
      });
    }

    // If all validations pass, continue to the next middleware
    next();
  };
};

/**
 * Middleware to validate multiple ObjectId parameters
 * @param {string[]} paramNames - Array of parameter names to validate
 * @returns {Function} Express middleware function
 */
const validateMultipleObjectIds = (paramNames) => {
  return (req, res, next) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName];
      
      if (!id || typeof id !== 'string' || id.length !== 24 || !mongoose.Types.ObjectId.isValid(id)) {
        logger.error(`Invalid ${paramName} parameter:`, { 
          id, 
          type: typeof id
        });
        return res.status(400).json({ 
          message: `Invalid ${paramName} format. ${paramName} must be a valid MongoDB ObjectId.` 
        });
      }
    }
    
    next();
  };
};

module.exports = {
  validateObjectId,
  validateMultipleObjectIds
};
