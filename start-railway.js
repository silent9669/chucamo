#!/usr/bin/env node

/**
 * Railway-optimized startup script
 * Simple, direct server startup without process spawning
 */

console.log('🚀 Starting Bluebook SAT Simulator for Railway...');
console.log('📁 Working directory:', process.cwd());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || 5000);

// Check if we're in Railway environment
const isRailway = process.env.RAILWAY_ENVIRONMENT || process.env.RAILWAY_URL || process.env.RAILWAY_PROJECT_ID;
if (isRailway) {
  console.log('🚂 Railway deployment detected');
  console.log('🔍 Health check will be available at: /ping');
  console.log('📦 Build directory check...');
  
  // Check if client build exists
  const fs = require('fs');
  const path = require('path');
  const buildPath = path.join(__dirname, 'client', 'build');
  
  if (fs.existsSync(buildPath)) {
    console.log('✅ Client build directory found');
    const buildFiles = fs.readdirSync(buildPath);
    console.log('📁 Build files:', buildFiles.length, 'items');
  } else {
    console.log('⚠️ Client build directory not found - will serve API only');
  }
}

// Enhanced error handling for Railway
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error.message);
  console.error('Stack:', error.stack);
  // Don't exit immediately in Railway, let it handle restart
  setTimeout(() => process.exit(1), 1000);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit immediately in Railway, let it handle restart
  setTimeout(() => process.exit(1), 1000);
});

// Graceful shutdown for Railway
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

try {
  // Start the server directly
  console.log('🔧 Loading server...');
  require('./server/index.js');
  console.log('✅ Server startup initiated successfully');
} catch (error) {
  console.error('❌ Failed to start server:', error.message);
  console.error('Stack:', error.stack);
  // Don't exit immediately in Railway, let it handle restart
  setTimeout(() => process.exit(1), 1000);
}
