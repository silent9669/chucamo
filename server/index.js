const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const questionRoutes = require('./routes/questions');
const resultRoutes = require('./routes/results');
const uploadRoutes = require('./routes/upload');
const articleRoutes = require('./routes/articles');
const vocabularyRoutes = require('./routes/vocabulary');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
const isDevelopment = process.env.NODE_ENV === 'development';
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_URL;

// Disable CSP in development to avoid localhost connection issues
if (isDevelopment) {
  app.use(helmet({
    contentSecurityPolicy: false
  }));
} else {
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'", "data:"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://www.desmos.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com",
          "data:"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],
        mediaSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:"
        ],
        connectSrc: [
          "'self'",
          "https://www.desmos.com",
          "https://*.railway.app"
        ],
        frameSrc: [
          "'self'",
          "https://www.desmos.com",
          "https://*.railway.app"
        ]
      }
    }
  }));
}
app.use(cors({
  origin: function (origin, callback) {
    // Add CORS debugging
    console.log('=== CORS REQUEST ===');
    console.log('Request origin:', origin);
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('No origin - allowing request');
      return callback(null, true);
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:5000',
      'http://localhost:5173',
      'https://chucamo-production.up.railway.app',
      'https://railway.com'
    ];
    
    console.log('Allowed origins:', allowedOrigins);
    console.log('Origin in allowed list:', allowedOrigins.indexOf(origin) !== -1);
    
    // Normalize origin by removing trailing slash for comparison
    const normalizedOrigin = origin.replace(/\/$/, '');
    const normalizedAllowedOrigins = allowedOrigins.map(origin => origin.replace(/\/$/, ''));
    
    if (normalizedAllowedOrigins.indexOf(normalizedOrigin) !== -1) {
      console.log('CORS: Allowing request from', origin, '(normalized:', normalizedOrigin, ')');
      callback(null, true);
    } else {
      console.log('CORS: Blocking request from', origin, '(normalized:', normalizedOrigin, ')');
      console.log('Normalized allowed origins:', normalizedAllowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting removed - no limits for users
// const authLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 50, // limit each IP to 50 login attempts per 15 minutes
//   message: 'Too many login attempts, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Rate limiting - General API routes
// const generalLimiter = rateLimit({
//   windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
//   max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // limit each IP to 1000 requests per windowMs
//   message: 'Too many requests from this IP, please try again later.',
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// Rate limiting removed - no limits applied
// app.use('/api/auth', authLimiter);
// app.use('/api/users', generalLimiter);
// app.use('/api/tests', generalLimiter);
// app.use('/api/questions', generalLimiter);
// app.use('/api/results', generalLimiter);
// app.use('/api/upload', generalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/vocabulary', vocabularyRoutes);

// Health check endpoints
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Bluebook SAT Simulator API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Bluebook SAT Simulator API is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Super simple health check endpoint for Railway
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Test endpoint for Railway
app.get('/test', (req, res) => {
  res.status(200).json({
    message: 'Server is working!',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Serve React app in production, Railway deployment, or when build directory exists
const buildPath = path.join(__dirname, '../client/build');
const buildExists = fs.existsSync(buildPath);

if (process.env.NODE_ENV === 'production' || isRailway || buildExists) {
  // Serve static files from React build
  app.use(express.static(buildPath));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
} else {
  // 404 handler for development when no build exists
  app.use('*', (req, res) => {
    res.status(404).json({ message: 'Route not found' });
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// Database connection
let MONGODB_URI = process.env.MONGODB_URI;

// Debug: Log environment variables
logger.debug('Environment check:');
logger.debug('- NODE_ENV:', process.env.NODE_ENV);
logger.debug('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
logger.debug('- MONGODB_URI length:', MONGODB_URI ? MONGODB_URI.length : 0);

// Add console logs for development debugging
console.log('=== SERVER STARTUP DEBUG ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('isDevelopment:', process.env.NODE_ENV === 'development');
console.log('CORS origins allowed:', [
  'http://localhost:3000',
  'http://localhost:3001', 
  'http://localhost:5000',
  'http://localhost:5173',
  'https://chucamo-production.up.railway.app',
  'https://railway.com'
]);
console.log('================================');

// If no MONGODB_URI is set, use a fallback for development
if (!MONGODB_URI) {
  logger.warn('No MONGODB_URI found in environment variables');
  if (process.env.NODE_ENV === 'production') {
    console.error('MONGODB_URI is required in production!');
    process.exit(1);
  } else {
    MONGODB_URI = 'mongodb://localhost:27017/bluebook-sat-simulator';
    logger.info('Using local MongoDB for development');
  }
}

// Debug: Log the MongoDB URI (without sensitive info)
logger.debug('MongoDB URI starts with:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'undefined');

// Validate MongoDB URI format
const isValidMongoURI = (uri) => {
  if (!uri) return false;
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
};

// Start server even if database connection fails (for healthcheck)
const startServer = () => {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
  logger.critical(`✅ Server running on port ${PORT}`);
  logger.info(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`✅ Health check available at: http://localhost:${PORT}/`);
  logger.info(`✅ Server ready to accept connections`);
});

    // Handle server errors
server.on('error', (error) => {
  logger.error('Server error:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
    process.exit(1);
  } else {
    logger.error('Unknown server error:', error);
    process.exit(1);
  }
});

    // Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.critical('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    logger.critical('✅ Server closed gracefully');
    process.exit(0);
  });
  
  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.warn('⚠️ Forcing exit after timeout');
    process.exit(1);
  }, 10000);
});

process.on('SIGINT', () => {
  logger.critical('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    logger.critical('✅ Server closed gracefully');
    process.exit(0);
  });
});

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      server.close(() => {
        logger.error('Server closed due to uncaught exception');
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => {
        logger.error('Server closed due to unhandled rejection');
        process.exit(1);
      });
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server immediately for Railway health check
logger.critical('🚀 Starting server immediately for Railway...');
startServer();

// Connect to MongoDB in background
if (isValidMongoURI(MONGODB_URI)) {
  logger.info('Attempting to connect to MongoDB...');
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  })
    .then(() => {
      logger.critical('✅ Connected to MongoDB successfully');
    })
    .catch((err) => {
      logger.error('❌ MongoDB connection error:', err);
      logger.warn('⚠️ Server running without database connection...');
    });
} else {
  logger.error('❌ Invalid MongoDB URI format. Please check your MONGODB_URI environment variable.');
  logger.warn('⚠️ Server running without database connection...');
}

module.exports = app; 