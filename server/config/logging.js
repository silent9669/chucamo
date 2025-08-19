// Production logging configuration to minimize Railway log volume
const isProduction = process.env.NODE_ENV === 'production';

const loggingConfig = {
  // Default log levels
  server: {
    default: isProduction ? 'ERROR' : 'DEBUG',
    override: process.env.LOG_LEVEL
  },
  
  client: {
    default: isProduction ? 'ERROR' : 'DEBUG',
    override: process.env.REACT_APP_LOG_LEVEL
  },
  
  // What to log in production
  production: {
    // Always log these
    always: ['ERROR', 'CRITICAL'],
    
    // Only log these if explicitly enabled
    conditional: ['WARN', 'INFO'],
    
    // Never log these in production
    never: ['DEBUG']
  },
  
  // Batch logging configuration
  batching: {
    enabled: isProduction,
    maxBatchSize: 10,
    flushInterval: 1000,
    summaryFormat: '[BATCHED] {count} logs: {summary}'
  }
};

module.exports = loggingConfig;
