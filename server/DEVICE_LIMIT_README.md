# Device Limit Functionality

## Overview

This implementation enforces a strict 2-device limit for user accounts. When a third device attempts to log in, the account is immediately locked for security.

## Features

✅ **2-Device Limit**: Users can only be logged in on 2 devices simultaneously  
✅ **Automatic Locking**: Third device login attempt immediately locks the account  
✅ **Session Tracking**: Each login creates a unique session with device info and IP  
✅ **JWT Integration**: Tokens include session IDs for enhanced security  
✅ **Logout Support**: Proper session cleanup when users log out  
✅ **Admin Unlock**: Locked accounts require admin intervention to unlock  

## Architecture

### Models

#### User Model (`models/User.js`)
- Added `status` field: `"active"` | `"locked"`
- Existing fields remain unchanged

#### Session Model (`models/Session.js`)
- `userId`: Reference to User
- `sessionId`: Unique session identifier (UUID)
- `deviceInfo`: Browser/device information
- `ip`: IP address of the device
- `createdAt`: Timestamp

### Middleware

#### `checkSession` (`middleware/checkSession.js`)
- Validates JWT tokens
- Checks account lock status
- Verifies session existence
- Can be used as an alternative to the existing `protect` middleware

### Routes

#### Login (`routes/auth.js`)
- Enhanced with device limit checking
- Creates session records
- Generates JWT with session ID
- Automatically locks account on third device

#### Logout (`routes/auth.js`)
- Removes session from database
- Allows new device to log in (if under limit)

## Implementation Details

### Login Flow

1. **User Authentication**: Verify email/password
2. **Account Status Check**: Ensure account is not locked
3. **Session Count**: Count active sessions for user
4. **Device Limit Check**: If ≥2 sessions, lock account
5. **Session Creation**: Create new session record
6. **Token Generation**: JWT includes session ID
7. **Response**: Return token and user data

### Security Features

- **Session Binding**: JWT tokens are tied to specific sessions
- **IP Tracking**: Records device IP addresses
- **Device Info**: Captures browser/device information
- **Automatic Locking**: Prevents account sharing
- **Admin Control**: Only admins can unlock accounts

### Database Schema

```javascript
// User Schema Addition
status: { type: String, default: "active" } // active | locked

// Session Schema
{
  userId: ObjectId,        // Reference to User
  sessionId: String,       // UUID
  deviceInfo: String,      // User-Agent
  ip: String,             // IP Address
  createdAt: Date         // Timestamp
}
```

## Usage

### Frontend Integration

```javascript
// Login request
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

// Logout request
const logoutResponse = await fetch('/api/auth/logout', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

### Error Handling

```javascript
// Handle device limit errors
if (response.status === 403) {
  const error = await response.json();
  if (error.message.includes('multiple devices')) {
    // Account locked due to device limit
    showError('Account locked: Too many devices');
  } else if (error.message.includes('locked')) {
    // Account locked for other reasons
    showError('Account locked: Contact admin');
  }
}
```

## Testing

### Test Scripts

1. **`testBuild.js`**: Verifies all modules load correctly
2. **`testLoginDeviceLimit.js`**: Tests core device limit logic
3. **`testAPIDeviceLimit.js`**: Comprehensive API testing
4. **`testServerStart.js`**: Server startup validation

### Running Tests

```bash
# Test build
node scripts/testBuild.js

# Test device limit functionality
node scripts/testLoginDeviceLimit.js

# Test API endpoints
node scripts/testAPIDeviceLimit.js

# Test server startup
node scripts/testServerStart.js
```

### Test Coverage

✅ **Device Limit Enforcement**: 2-device maximum  
✅ **Account Locking**: Automatic lock on third device  
✅ **Session Management**: Create, validate, delete sessions  
✅ **JWT Integration**: Token validation with session binding  
✅ **Error Handling**: Proper HTTP status codes and messages  
✅ **Logout Functionality**: Session cleanup  
✅ **Security**: IP and device tracking  

## Configuration

### Environment Variables

```bash
JWT_SECRET=your-jwt-secret
JWT_EXPIRE=7d
MONGODB_URI=your-mongodb-connection-string
```

### JWT Token Structure

```javascript
{
  "id": "user_id",
  "sessionId": "uuid-session-id",
  "iat": timestamp,
  "exp": timestamp
}
```

## Security Considerations

1. **Session Binding**: JWT tokens are invalidated when sessions are deleted
2. **IP Tracking**: Helps identify suspicious login patterns
3. **Device Fingerprinting**: Captures device information for audit trails
4. **Automatic Locking**: Prevents account sharing and abuse
5. **Admin Control**: Locked accounts require manual intervention

## Migration Notes

- **Backward Compatible**: Existing users automatically get `status: "active"`
- **No Data Loss**: All existing user data is preserved
- **Gradual Rollout**: Can be enabled without affecting current users
- **Admin Tools**: Scripts available for managing locked accounts

## Troubleshooting

### Common Issues

1. **Account Locked**: User attempted login from third device
2. **Session Invalid**: JWT token tied to deleted session
3. **Database Connection**: Ensure MongoDB is accessible
4. **Environment Variables**: Check JWT_SECRET and MONGODB_URI

### Debug Commands

```bash
# Check user status
db.users.findOne({email: "user@example.com"}, {status: 1})

# Check active sessions
db.sessions.find({userId: ObjectId("user_id")})

# Unlock account (admin only)
db.users.updateOne(
  {email: "user@example.com"}, 
  {$set: {status: "active"}}
)
```

## Future Enhancements

- **Device Whitelist**: Allow trusted devices
- **Session Expiry**: Automatic session cleanup
- **Notification System**: Alert users of new logins
- **Analytics Dashboard**: Monitor login patterns
- **Geolocation**: Track login locations

## Support

For issues or questions regarding the device limit functionality:

1. Check the test scripts for validation
2. Review MongoDB logs for connection issues
3. Verify environment variable configuration
4. Test with the provided test scripts

---

**Implementation Status**: ✅ Complete and Tested  
**Last Updated**: August 14, 2025  
**Version**: 1.0.0
