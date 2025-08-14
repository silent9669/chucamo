# Test Attempt Logic Implementation

## Overview

This implementation provides a comprehensive test attempt system that distinguishes between different user account types and handles test attempts appropriately.

## User Account Types and Attempt Limits

### Free Users
- **Max Attempts**: 1 per test
- **Behavior**: Can only complete each test once
- **Upgrade Path**: Can upgrade to student account for more attempts

### Student Users
- **Max Attempts**: 3 per test
- **Behavior**: Can complete each test up to 3 times
- **Upgrade Path**: Can upgrade to teacher account for unlimited attempts

### Teacher Users
- **Max Attempts**: Unlimited (∞)
- **Behavior**: Can take tests as many times as needed
- **Restrictions**: None

### Admin Users
- **Max Attempts**: Unlimited (∞)
- **Behavior**: Can take tests as many times as needed
- **Restrictions**: None

## Key Features

### 1. Save & Exit (Not Counted as Attempt)
- Users can save their progress and exit a test without it counting as an attempt
- Progress is stored locally and can be resumed later
- No server-side attempt is created until the test is actually completed

### 2. Finish Test (Counted as Attempt)
- Only when a user completes a test does it count as an attempt
- Attempts are tracked in the database with status 'completed'
- Incomplete tests (status 'in-progress') are not counted toward the limit

### 3. Resume Incomplete Tests
- Users can resume tests they previously saved and exited
- The system checks for existing incomplete results before creating new ones
- Seamless continuation of saved progress

### 4. Attempt Limit Enforcement
- Server-side validation prevents users from exceeding their attempt limits
- Clear error messages indicating when limits are reached
- Appropriate upgrade suggestions for free users

## Implementation Details

### Server-Side Changes

#### `server/routes/results.js`
- **POST /api/results**: Enhanced to check attempt limits before starting tests
- **PUT /api/results/:id**: Tracks test completion and logs attempt data
- **GET /api/results/attempt-status/:testId**: New endpoint to check user's attempt status

#### Key Logic Changes:
```javascript
// Only count COMPLETED tests, not incomplete ones
const existingCompletedAttempts = await Result.countDocuments({
  user: req.user.id,
  test: testId,
  status: 'completed' // Only count completed tests as attempts
});

// Check if there's an existing incomplete result that can be resumed
const existingIncompleteResult = await Result.findOne({
  user: req.user.id,
  test: testId,
  status: 'in-progress'
});
```

### Client-Side Changes

#### `client/src/pages/Tests/TestTaker.js`
- Enhanced error handling for attempt limit violations
- Better user experience with clear error messages
- Upgrade account suggestions for free users

#### `client/src/pages/Tests/Tests.js`
- Shows attempt information for each test
- Displays current attempts vs. max attempts
- Clear indication of user's account type and limits

## User Experience Flow

### 1. Starting a Test
```
User clicks "Start Test" → System checks attempt limits → 
If within limits: Test starts normally
If at limit: Shows appropriate error message with upgrade options
```

### 2. Save & Exit
```
User clicks "Save & Exit" → Progress saved locally → 
User redirected to tests list → No attempt counted
```

### 3. Resume Test
```
User clicks "Continue Test" → System loads saved progress → 
User continues from where they left off → No new attempt created
```

### 4. Finish Test
```
User completes test → System submits results → 
Attempt counted in database → User sees completion message
```

### 5. Attempt Limit Reached
```
User tries to start test → System checks limits → 
If at limit: Shows error message with account type info → 
Suggests upgrade for free users
```

## Error Messages

### Free Users (1 attempt limit)
```
"Free account type reached max attempt (1). Upgrade to student account for more attempts."
```

### Student Users (3 attempts limit)
```
"Student account type reached max attempt (3)."
```

### Admin/Teacher Users
```
No limits - unlimited attempts available
```

## Testing

### Test Script
A comprehensive test script is available at `server/scripts/testAttemptLogic.js` that:
- Creates test users with different account types
- Tests attempt limits for each user type
- Verifies attempt counting logic
- Tests resume functionality

### Running Tests
```bash
cd server/scripts
node testAttemptLogic.js
```

## Database Schema

### Result Model
The Result model tracks:
- `status`: 'in-progress' or 'completed'
- `attemptNumber`: Sequential attempt number
- `startTime`: When the attempt started
- `endTime`: When the attempt was completed (if completed)

### Key Fields for Attempt Logic
```javascript
{
  user: ObjectId,        // User taking the test
  test: ObjectId,        // Test being taken
  attemptNumber: Number, // Sequential attempt number
  status: String,        // 'in-progress' or 'completed'
  startTime: Date,       // When attempt started
  endTime: Date          // When attempt completed (if completed)
}
```

## Security Considerations

1. **Server-Side Validation**: All attempt limit checks happen on the server
2. **User Authentication**: Users can only access their own attempt data
3. **Status Tracking**: Only completed tests count toward attempt limits
4. **Resume Protection**: Users can only resume their own incomplete tests

## Future Enhancements

1. **Attempt Analytics**: Track attempt patterns and success rates
2. **Time-Based Limits**: Add daily/weekly attempt limits
3. **Premium Features**: Additional attempts for premium users
4. **Attempt History**: Detailed view of all test attempts
5. **Performance Tracking**: Compare performance across attempts

## Troubleshooting

### Common Issues

1. **Attempt Count Mismatch**: Ensure only 'completed' status results are counted
2. **Resume Not Working**: Check for existing 'in-progress' results
3. **Limit Not Enforced**: Verify server-side validation is working
4. **User Type Not Recognized**: Check user.accountType field in database

### Debug Logging

The system includes comprehensive logging:
- Test start attempts
- Attempt limit checks
- Test completions
- Attempt counting

Check server console for detailed attempt logic logs.
