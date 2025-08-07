const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testRoutes = require('./routes/tests');
const questionRoutes = require('./routes/questions');
const resultRoutes = require('./routes/results');
const uploadRoutes = require('./routes/upload');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "https://apis.google.com",
        "https://www.gstatic.com",
        "https://accounts.google.com",
        "https://www.desmos.com"
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://accounts.google.com"
      ],
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com"
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:"
      ],
      connectSrc: [
        "'self'",
        "https://apis.google.com",
        "https://accounts.google.com",
        "https://www.desmos.com"
      ],
      frameSrc: [
        "'self'",
        "https://accounts.google.com",
        "https://www.desmos.com"
      ]
    }
  }
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.RAILWAY_URL || 'https://your-app-name.railway.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

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

// Health check endpoints (before React app)
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

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  // Serve static files from React build
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // 404 handler for development
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
console.log('Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('- MONGODB_URI length:', MONGODB_URI ? MONGODB_URI.length : 0);

// If no MONGODB_URI is set, use a fallback for development
if (!MONGODB_URI) {
  console.log('No MONGODB_URI found in environment variables');
  if (process.env.NODE_ENV === 'production') {
    console.error('MONGODB_URI is required in production!');
    process.exit(1);
  } else {
    MONGODB_URI = 'mongodb://localhost:27017/bluebook-sat-simulator';
    console.log('Using local MongoDB for development');
  }
}

// Debug: Log the MongoDB URI (without sensitive info)
console.log('MongoDB URI starts with:', MONGODB_URI ? MONGODB_URI.substring(0, 20) + '...' : 'undefined');

// Validate MongoDB URI format
const isValidMongoURI = (uri) => {
  if (!uri) return false;
  return uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
};

// Start server even if database connection fails (for healthcheck)
const startServer = () => {
  try {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`✅ Health check available at: http://localhost:${PORT}/`);
      console.log(`✅ Server ready to accept connections`);
    });

    // Handle server errors
    server.on('error', (error) => {
      console.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
      } else {
        console.error('Unknown server error:', error);
        process.exit(1);
      }
    });

    // Graceful shutdown handling
    process.on('SIGTERM', () => {
      console.log('🛑 SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
      });
      
      // Force exit after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        console.log('⚠️ Forcing exit after timeout');
        process.exit(1);
      }, 10000);
    });

    process.on('SIGINT', () => {
      console.log('🛑 SIGINT received, shutting down gracefully...');
      server.close(() => {
        console.log('✅ Server closed gracefully');
        process.exit(0);
      });
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      server.close(() => {
        console.log('Server closed due to uncaught exception');
        process.exit(1);
      });
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      server.close(() => {
        console.log('Server closed due to unhandled rejection');
        process.exit(1);
      });
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start server immediately for Railway health check
console.log('🚀 Starting server immediately for Railway...');
startServer();

// Connect to MongoDB in background
if (isValidMongoURI(MONGODB_URI)) {
  console.log('Attempting to connect to MongoDB...');
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
  })
    .then(() => {
      console.log('✅ Connected to MongoDB successfully');
    })
    .catch((err) => {
      console.error('❌ MongoDB connection error:', err);
      console.log('⚠️ Server running without database connection...');
    });
} else {
  console.error('❌ Invalid MongoDB URI format. Please check your MONGODB_URI environment variable.');
  console.log('⚠️ Server running without database connection...');
}

module.exports = app; 