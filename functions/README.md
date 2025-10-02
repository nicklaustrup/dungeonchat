# Cloud Functions - Superchat

This directory contains Firebase Cloud Functions for the Superchat application.

## Available Functions

### 1. checkUsernameAvailability
**File:** `checkUsernameAvailability.js`

Checks if a username is available for registration.

**Type:** Callable HTTPS Function

**Usage:**
```javascript
const checkUsername = httpsCallable(functions, 'checkUsernameAvailability');
const result = await checkUsername({ username: 'testuser' });
console.log(result.data.available); // true or false
```

### 2. deleteUser
**File:** `deleteUser.js`

Permanently deletes a user account and all associated data.

**Type:** Callable HTTPS Function

**Authentication:** Required (user can only delete their own account)

**Usage:**
```javascript
const deleteUserFunc = httpsCallable(functions, 'deleteUser');
const result = await deleteUserFunc();
// User account deleted, user is signed out
```

**What it deletes:**
- User profile and settings
- Username reservation
- Presence data
- All owned campaigns (complete deletion)
- Campaign memberships (removed from campaigns)
- Character sheets
- Tokens
- Messages (anonymized to preserve conversation context)

See [USER_DELETION.md](../docs/USER_DELETION.md) for complete documentation.

### 3. Voice Chat Functions
**File:** `voiceChatFunctions.js`

Functions for managing voice chat sessions.

**Included Functions:**
- Voice room management
- Participant tracking
- Audio stream coordination

## Development

### Installation

```bash
cd functions
npm install
```

### Testing Locally

```bash
# Start Firebase emulators
firebase emulators:start

# Test functions locally
npm test
```

### Deployment

Deploy all functions:
```bash
firebase deploy --only functions
```

Deploy specific function:
```bash
firebase deploy --only functions:deleteUser
```

## Configuration

### Environment Variables

Set environment variables for functions:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

View current config:
```bash
firebase functions:config:get
```

### Dependencies

Main dependencies:
- `firebase-admin`: Firebase Admin SDK
- `firebase-functions`: Cloud Functions SDK
- `leo-profanity`: Profanity filtering (legacy)

Install dependencies:
```bash
npm install
```

## Security

### Authentication
- Callable functions automatically include user authentication
- Check `request.auth` to verify user is authenticated
- Use `request.auth.uid` to get user ID

### Authorization
- Functions run with admin privileges
- Implement proper authorization checks
- Validate all user inputs

### Best Practices
- Always validate input parameters
- Use try-catch for error handling
- Log errors for debugging
- Return meaningful error messages
- Use Firestore batch operations for atomicity

## Monitoring

### Cloud Functions Dashboard
View function metrics in Firebase Console:
- Invocations
- Execution time
- Memory usage
- Error rates

### Logs
View function logs:
```bash
firebase functions:log
```

Filter by function:
```bash
firebase functions:log --only deleteUser
```

## Performance

### Optimization Tips
1. Use async/await properly
2. Batch Firestore operations
3. Minimize cold starts with global variables
4. Use appropriate memory allocation
5. Implement timeouts for long operations

### Limits
- Max execution time: 540 seconds (9 minutes)
- Max memory: 8GB
- Max concurrent executions: 3000 (default)

## Error Handling

### Standard Error Codes
- `unauthenticated`: User not signed in
- `permission-denied`: Insufficient permissions
- `invalid-argument`: Invalid function parameters
- `not-found`: Resource not found
- `internal`: Server error

### Throwing Errors
```javascript
const { HttpsError } = require('firebase-functions/v2/https');

throw new HttpsError('invalid-argument', 'Username is required');
```

## Testing

### Unit Tests
Create tests in `__tests__` directory:
```javascript
const { deleteUser } = require('../deleteUser');

describe('deleteUser', () => {
  it('should delete user data', async () => {
    // Test implementation
  });
});
```

### Integration Tests
Test with Firebase emulators:
```bash
firebase emulators:start
npm test
```

## Versioning

Functions use Firebase Functions v2 SDK:
- Better performance
- More features
- Improved error handling

## Migrations

When updating existing functions:
1. Test thoroughly in development
2. Deploy to staging first
3. Monitor for errors
4. Rollback if issues occur

## Contributing

When adding new functions:
1. Create new file in `functions/` directory
2. Export function in `index.js`
3. Add documentation in this README
4. Add tests
5. Update security rules if needed

## Troubleshooting

### Common Issues

**Function not found:**
- Check if function is exported in `index.js`
- Verify function name matches
- Ensure function is deployed

**Permission denied:**
- Check Firestore security rules
- Verify user authentication
- Check function authorization logic

**Timeout errors:**
- Optimize database queries
- Use batch operations
- Consider breaking into smaller operations

**Memory exceeded:**
- Optimize data processing
- Process in smaller batches
- Increase memory allocation

## Resources

- [Firebase Cloud Functions Documentation](https://firebase.google.com/docs/functions)
- [Cloud Functions v2 Guide](https://firebase.google.com/docs/functions/callable)
- [Firestore Admin SDK](https://firebase.google.com/docs/firestore/server/start)
- [Best Practices](https://firebase.google.com/docs/functions/best-practices)
