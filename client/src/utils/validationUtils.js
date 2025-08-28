/**
 * Utility functions for validation
 */

/**
 * Validates if a string looks like a valid MongoDB ObjectId
 * @param {any} id - The ID to validate
 * @returns {boolean} - True if the ID appears valid
 */
export const isValidObjectId = (id) => {
  if (!id) return false;
  if (typeof id !== 'string') return false;
  if (id.length !== 24) return false;
  
  // Check if it's a 24-character hex string
  const hexRegex = /^[0-9a-fA-F]{24}$/;
  return hexRegex.test(id);
};

/**
 * Safely encodes an ID for use in URLs
 * @param {any} id - The ID to encode
 * @returns {string|null} - The encoded ID or null if invalid
 */
export const safeEncodeId = (id) => {
  if (!isValidObjectId(id)) {
    console.error('Invalid ObjectId:', { id, type: typeof id });
    return null;
  }
  return encodeURIComponent(id);
};

/**
 * Validates and logs ID issues for debugging
 * @param {any} id - The ID to validate
 * @param {string} context - Context where the ID is being used
 * @returns {boolean} - True if the ID is valid
 */
export const validateAndLogId = (id, context = 'unknown') => {
  if (!id) {
    console.error(`[${context}] Missing ID`);
    return false;
  }
  
  if (typeof id !== 'string') {
    console.error(`[${context}] Invalid ID type:`, { id, type: typeof id });
    return false;
  }
  
  if (id.length !== 24) {
    console.error(`[${context}] Invalid ID length:`, { id, length: id.length });
    return false;
  }
  
  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    console.error(`[${context}] Invalid ID format:`, { id });
    return false;
  }
  
  return true;
};
