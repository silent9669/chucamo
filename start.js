const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Enhanced startup logging for Railway
console.log('🚀 Starting Bluebook SAT Simulator...');
console.log('📁 Current working directory:', process.cwd());
console.log('📦 Node version:', process.version);
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', process.env.PORT || 5000);

// Check if server directory exists
const serverPath = path.join(__dirname, 'server', 'index.js');
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server file not found at:', serverPath);
  console.error('📁 Available files in server directory:');
  try {
    const serverDir = path.join(__dirname, 'server');
    if (fs.existsSync(serverDir)) {
      const files = fs.readdirSync(serverDir);
      console.log('Files:', files);
    } else {
      console.error('Server directory does not exist');
    }
  } catch (err) {
    console.error('Error reading server directory:', err.message);
  }
  process.exit(1);
}

console.log('✅ Server file found at:', serverPath);

// Start the server with better error handling
const server = spawn('node', [serverPath], {
  stdio: 'inherit',
  env: process.env,
  cwd: __dirname
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code, signal) => {
  if (code !== 0) {
    console.error(`❌ Server process exited with code ${code} and signal ${signal}`);
    process.exit(code || 1);
  }
});

// Enhanced process management for Railway
process.on('exit', (code) => {
  console.log(`🔄 Server exited with code ${code}`);
});

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  if (server && !server.killed) {
    server.kill('SIGTERM');
  }
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  if (server && !server.killed) {
    server.kill('SIGINT');
  }
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (server && !server.killed) {
    server.kill();
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  if (server && !server.killed) {
    server.kill();
  }
  process.exit(1);
});

console.log('✅ Startup script completed, server should be running...');
