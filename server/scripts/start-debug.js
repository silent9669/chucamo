const { spawn } = require('child_process');
const path = require('path');

console.log('=== Railway Debug Startup Script ===');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

// Check if client build exists
const clientBuildPath = path.join(__dirname, '../../client/build');
const fs = require('fs');

if (fs.existsSync(clientBuildPath)) {
  console.log('✅ Client build directory exists');
  const buildFiles = fs.readdirSync(clientBuildPath);
  console.log('Build files:', buildFiles.slice(0, 5), '...');
} else {
  console.log('❌ Client build directory does not exist');
}

// Check environment variables
console.log('\n=== Environment Variables ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('MONGODB_URI exists:', !!process.env.MONGODB_URI);
console.log('RAILWAY_URL:', process.env.RAILWAY_URL);

// Start the server
console.log('\n=== Starting Server ===');
const server = spawn('node', ['server/index.js'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Server exited with code ${code}`);
  process.exit(code);
});
