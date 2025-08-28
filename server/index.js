const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const cookieParser = require('cookie-parser');
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
const vocabQuizRoutes = require('./routes/vocabQuizzes');
const lessonRoutes = require('./routes/lessons');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Cookie parser middleware - required for JWT authentication
app.use(cookieParser());

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
          "https://*.railway.app",
          "https://www.youtube.com",
          "https://youtube.com",
          "https://drive.google.com",
          "https://docs.google.com"
        ]
      }
    }
  }));
}

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
  : [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://yourdomain.com'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // In development mode, be more permissive with localhost
    if (process.env.NODE_ENV === 'development') {
      // Allow all localhost origins in development
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        logger.debug('CORS: Allowing localhost request from', origin);
        return callback(null, true);
      }
    }
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      logger.debug('No origin - allowing request');
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    const normalizedOrigin = origin.toLowerCase().replace(/^https?:\/\//, '');
    const normalizedAllowedOrigins = allowedOrigins.map(o => o.toLowerCase().replace(/^https?:\/\//, ''));
    
    if (allowedOrigins.indexOf(origin) !== -1 || normalizedAllowedOrigins.indexOf(normalizedOrigin) !== -1) {
      // Only log in development to reduce Railway logs and prevent information disclosure
      if (process.env.NODE_ENV === 'development') {
        logger.debug('CORS: Allowing request from', origin);
      }
      callback(null, true);
    } else {
      // Only log in development to reduce Railway logs and prevent information disclosure
      if (process.env.NODE_ENV === 'development') {
        logger.debug('CORS: Blocking request from', origin);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

// Log CORS configuration in production
if (process.env.NODE_ENV === 'production') {
  console.log('=== CORS CONFIGURATION ===');
  console.log('Allowed origins:', allowedOrigins);
  console.log('Environment:', process.env.NODE_ENV);
  console.log('=======================');
}

// Rate limiting for authentication routes only (DDoS protection)
const rateLimitWindow = parseInt(process.env.RATE_LIMIT_WINDOW) || 15;
const rateLimitMax = parseInt(process.env.RATE_LIMIT_MAX) || 50;

const authLimiter = rateLimit({
  windowMs: rateLimitWindow * 60 * 1000, // Convert minutes to milliseconds
  max: rateLimitMax, // limit each IP to max attempts per window
  message: { 
    error: 'Too many login attempts, please try again later.',
    retryAfter: rateLimitWindow // minutes
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  keyGenerator: (req) => {
    // Use IP + username for more targeted rate limiting
    return req.ip + ':' + (req.body.username || req.body.email || 'unknown');
  }
});

// Log rate limiting configuration in production
if (process.env.NODE_ENV === 'production') {
  console.log('=== RATE LIMITING CONFIGURATION ===');
  console.log('Window (minutes):', rateLimitWindow);
  console.log('Max attempts:', rateLimitMax);
  console.log('===============================');
}

// Body parsing middleware (must come before rate limiting)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply rate limiting only to authentication routes
app.use('/api/auth', authLimiter);

// Static files
app.use('/uploads', express.static('uploads'));

// Global error handler middleware
app.use((err, req, res, next) => {
  // Log full error details for debugging (but don't expose to client)
  logger.error('Global error handler caught:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    origin: req.headers.origin,
    userAgent: req.headers['user-agent']
  });
  
  // Don't expose internal errors or stack traces in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;
  
  res.status(500).json({
    success: false,
    message: message,
    // Stack traces only in development to prevent information disclosure
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/vocabulary', vocabularyRoutes);
app.use('/api/vocab-quizzes', vocabQuizRoutes);
app.use('/api/lessons', lessonRoutes);

// Super simple health check endpoint for Railway (primary health check)
app.get('/ping', (req, res) => {
  res.status(200).send('pong');
});

// Root health check endpoint for Railway (fallback)
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Bluebook SAT Simulator API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',').length : 0,
      configured: !!process.env.ALLOWED_ORIGINS
    },
    security: {
      rateLimiting: !!process.env.RATE_LIMIT_WINDOW,
      jwtCookies: true,
      helmet: true
    }
  });
});

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
  // Log full error details for debugging (but don't expose to client)
  logger.error('Server error:', err.message);
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }
  // Generic error message in production to prevent information disclosure
  res.status(500).json({ message: 'Internal server error' });
});

// Database connection
let MONGODB_URI = process.env.MONGODB_URI;

// Debug: Log environment variables
logger.debug('Environment check:');
logger.debug('- NODE_ENV:', process.env.NODE_ENV);
logger.debug('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
logger.debug('- MONGODB_URI length:', MONGODB_URI ? MONGODB_URI.length : 0);

// Add console logs for development debugging only
if (process.env.NODE_ENV === 'development') {
  console.log('=== SERVER STARTUP DEBUG ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('isDevelopment:', process.env.NODE_ENV === 'development');
  console.log('CORS origins allowed:', [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5000',
    'http://localhost:5173',
    process.env.ALLOWED_ORIGIN || 'https://yourdomain.com',
    'https://railway.com'
  ]);
  console.log('================================');
} else {
  // Production logging
  console.log('=== PRODUCTION SERVER STARTUP ===');
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('Environment:', process.env.NODE_ENV || 'unknown');
  console.log('CORS origins configured:', process.env.ALLOWED_ORIGINS ? 'Yes' : 'No');
  console.log('Rate limiting configured:', process.env.RATE_LIMIT_WINDOW ? 'Yes' : 'No');
  console.log('================================');
}

// If no MONGODB_URI is set, use a fallback for development
if (!MONGODB_URI) {
  logger.warn('No MONGODB_URI found in environment variables');
  if (process.env.NODE_ENV === 'production') {
    logger.error('MONGODB_URI is required in production!');
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
    // Validate production environment variables
    if (process.env.NODE_ENV === 'production') {
      const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'ALLOWED_ORIGINS'];
      const missingVars = requiredVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Missing required production environment variables:', missingVars);
        console.error('Please check your Railway environment configuration');
      } else {
        console.log('✅ All required production environment variables are set');
      }
    }
    
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

// Add Railway-specific startup logging
if (process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_URL) {
  console.log('🚂 Railway deployment detected');
  console.log('🌍 Environment:', process.env.NODE_ENV);
  console.log('🔌 Port:', process.env.PORT);
  console.log('📁 Working directory:', process.cwd());
  console.log('🔍 Health check available at: /ping');
}

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