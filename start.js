const { spawn } = require('child_process');
const path = require('path');

// Minimal startup logging to reduce Railway logs
console.log('🚀 Starting Bluebook SAT Simulator...');

// Only log environment in development
if (process.env.NODE_ENV !== 'production') {
  console.log('Environment:', process.env.NODE_ENV || 'development');
  console.log('Port:', process.env.PORT || 5000);
}

// Start the server
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Process management
process.on('exit', (code) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Server exited with code ${code}`);
  }
});

process.on('SIGTERM', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('SIGTERM received, shutting down...');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('SIGINT received, shutting down...');
  }
  process.exit(0);
});
