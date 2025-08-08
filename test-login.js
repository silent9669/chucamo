const axios = require('axios');

const testLogin = async () => {
  try {
    console.log('🧪 Testing login API...');
    
    const loginData = {
      username: 'localadmin',
      password: 'admin123'
    };
    
    console.log('📤 Sending login request with:', loginData);
    
    const response = await axios.post('http://localhost:5000/api/auth/login', loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Login successful!');
    console.log('📊 Response:', response.data);
    
  } catch (error) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('📊 Status:', error.response.status);
      console.log('📊 Data:', error.response.data);
    } else {
      console.log('📊 Error:', error.message);
    }
  }
};

testLogin();
