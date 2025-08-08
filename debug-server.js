const axios = require('axios');

const debugServer = async () => {
  try {
    console.log('🔍 Debugging server connection...');
    
    // Test 1: Check if server is responding
    console.log('\n1️⃣ Testing server health...');
    try {
      const healthResponse = await axios.get('http://localhost:5000/health');
      console.log('✅ Server health check:', healthResponse.data);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
    }
    
    // Test 2: Check if API is responding
    console.log('\n2️⃣ Testing API health...');
    try {
      const apiHealthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ API health check:', apiHealthResponse.data);
    } catch (error) {
      console.log('❌ API health check failed:', error.message);
    }
    
    // Test 3: Test login with different credentials
    console.log('\n3️⃣ Testing login with different credentials...');
    
    const testCredentials = [
      { username: 'localadmin', password: 'admin123' },
      { username: 'localadmin@localhost.com', password: 'admin123' },
      { username: 'backuplocal', password: 'password123' },
      { username: 'backuplocal@localhost.com', password: 'password123' }
    ];
    
    for (const cred of testCredentials) {
      try {
        console.log(`\n🔍 Testing: ${cred.username} / ${cred.password}`);
        const response = await axios.post('http://localhost:5000/api/auth/login', cred, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('✅ SUCCESS:', response.data);
        break; // Stop if one works
      } catch (error) {
        if (error.response) {
          console.log('❌ Failed:', error.response.status, error.response.data.message);
        } else {
          console.log('❌ Failed:', error.message);
        }
      }
    }
    
    // Test 4: Check if there are any users in the database
    console.log('\n4️⃣ Testing user search...');
    try {
      // Try to register a test user to see if database is working
      const testUser = {
        firstName: 'Test',
        lastName: 'User',
        username: 'testuser123',
        email: 'testuser123@test.com',
        password: 'test123'
      };
      
      const registerResponse = await axios.post('http://localhost:5000/api/auth/register', testUser, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Registration test:', registerResponse.data);
      
      // Now try to login with the test user
      const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
        username: 'testuser123',
        password: 'test123'
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('✅ Test user login:', loginResponse.data);
      
    } catch (error) {
      if (error.response) {
        console.log('❌ Registration/Login test failed:', error.response.status, error.response.data.message);
      } else {
        console.log('❌ Registration/Login test failed:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
};

debugServer();
