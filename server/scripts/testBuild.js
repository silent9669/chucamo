const mongoose = require('mongoose');
const User = require('../models/User');
const Session = require('../models/Session');
const checkSession = require('../middleware/checkSession');

console.log('🧪 Testing build and imports...\n');

try {
  console.log('✅ User model imported successfully');
  console.log('✅ Session model imported successfully');
  console.log('✅ checkSession middleware imported successfully');
  
  // Test model schemas
  console.log('✅ User schema fields:', Object.keys(User.schema.paths).slice(0, 10).join(', '));
  console.log('✅ Session schema fields:', Object.keys(Session.schema.paths).join(', '));
  
  console.log('\n🎉 All imports and models working correctly!');
  console.log('✅ Build test passed!');
  
} catch (error) {
  console.error('❌ Build test failed:', error.message);
  process.exit(1);
}
