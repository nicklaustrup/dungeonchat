# User Account Deletion

This document describes the user account deletion feature and its implementation.

## Overview

The user account deletion feature allows users to permanently delete their accounts and all associated data from the Superchat platform. This feature ensures compliance with data privacy regulations (GDPR, CCPA) and provides users with full control over their data.

## Architecture

### Cloud Function (`functions/deleteUser.js`)

A secure server-side Cloud Function that:
- Authenticates the request
- Deletes user data from Firestore and Realtime Database
- Handles campaign ownership and membership
- Anonymizes user messages
- Removes user from Firebase Authentication

### Client Service (`src/services/userDeletionService.js`)

Provides:
- `deleteUserAccount()` - Calls the cloud function
- `confirmAccountDeletion()` - Shows confirmation dialogs
- `useUserDeletion()` - React hook for account deletion

### UI Component (`src/components/Settings/DeleteAccountSection.js`)

A React component with:
- Danger zone UI with unlock mechanism
- Comprehensive warnings about data deletion
- Multi-step confirmation process
- Loading and error states

## Data Deletion Scope

When a user deletes their account, the following data is removed or anonymized:

### Deleted Permanently

1. **User Profile** (`userProfiles/{userId}`)
   - Profile information, settings, preferences
   
2. **Username Entry** (`usernames/{username}`)
   - Username reservation
   
3. **Presence Data** (Realtime Database `presence/{userId}`)
   - Online/offline status
   
4. **Campaigns Owned** (`campaigns/{campaignId}`)
   - All campaigns where user is DM
   - All subcollections (members, channels, maps, tokens, etc.)
   
5. **Campaign Memberships** (`campaigns/{campaignId}/members/{userId}`)
   - Removes user from all campaigns they joined
   - Updates member counts
   
6. **Character Sheets** (`campaigns/{campaignId}/characters/{userId}`)
   - All character data across all campaigns
   
7. **Tokens** (VTT tokens owned by user)
   - Player tokens on maps
   
8. **User Campaigns Tracking** (`userCampaigns/{userId}`)
   - Campaign associations

### Anonymized (Preserved for Context)

1. **Messages** (`messages/{messageId}` and campaign channel messages)
   - User ID changed to "deleted_user"
   - Display name changed to "[Deleted User]"
   - Photo URL removed
   - Message content and reactions preserved

## Security

### Authentication
- Function requires authenticated user (`request.auth`)
- User can only delete their own account
- Throws `unauthenticated` error if not signed in

### Authorization
- Cloud Function runs with admin privileges
- Client calls via Firebase SDK with user credentials
- Security rules prevent unauthorized access

### Atomicity
- Uses Firestore batch operations where possible
- Handles subcollections recursively
- Continues deletion even if some operations fail (logs errors)

## User Flow

1. User navigates to Settings/Account page
2. Clicks "Unlock Danger Zone" button
3. Views comprehensive warning about deletion effects
4. Clicks "Delete My Account" button
5. Confirms deletion by typing username
6. Provides final confirmation
7. Account and data deleted
8. User automatically signed out
9. Redirected to home page

## Error Handling

The system handles various error scenarios:

- **Unauthenticated**: User not signed in
- **Network errors**: Connection issues
- **Partial deletion**: Some data deleted, some failed (logged)
- **Username mismatch**: Confirmation cancelled

## Usage

### Adding to Settings Page

```jsx
import DeleteAccountSection from '../components/Settings/DeleteAccountSection';

function SettingsPage() {
  return (
    <div className="settings-page">
      {/* Other settings */}
      
      <DeleteAccountSection />
    </div>
  );
}
```

### Direct Function Call

```javascript
import { deleteUserAccount } from '../services/userDeletionService';

async function handleDelete() {
  try {
    const result = await deleteUserAccount(functions, auth);
    console.log('Deletion successful:', result);
  } catch (error) {
    console.error('Deletion failed:', error);
  }
}
```

## Testing

### Test Scenarios

1. **Happy Path**
   - Create test user
   - Create test campaign
   - Join another campaign
   - Delete account
   - Verify all data removed

2. **Campaign Ownership**
   - Create campaign as DM
   - Add players
   - Delete DM account
   - Verify campaign deleted

3. **Campaign Membership**
   - Join campaign as player
   - Delete account
   - Verify removed from campaign
   - Verify character sheet deleted

4. **Message Anonymization**
   - Send messages in chat
   - Send messages in campaign channels
   - Delete account
   - Verify messages show "[Deleted User]"

5. **Cancellation**
   - Start deletion process
   - Cancel at confirmation
   - Verify account not deleted

## Deployment

### Deploy Cloud Function

```bash
cd functions
npm install
firebase deploy --only functions:deleteUser
```

### Environment Requirements

- Firebase Admin SDK
- Firestore
- Realtime Database
- Cloud Functions v2

## Compliance

This implementation helps with:

- **GDPR Right to Erasure**: Users can request complete data deletion
- **CCPA Right to Delete**: California residents can delete personal data
- **Data Minimization**: Removes unnecessary data
- **User Control**: Users have full control over their data

## Future Enhancements

Potential improvements:

1. **Export Before Delete**: Allow users to download their data first
2. **Soft Delete**: Mark as deleted with 30-day grace period
3. **Transfer Ownership**: Transfer campaigns to other users before deletion
4. **Email Confirmation**: Send confirmation email before deletion
5. **Audit Log**: Log all deletion operations for compliance
6. **Scheduled Deletion**: Allow users to schedule deletion for future date
7. **Admin Override**: Allow admins to prevent deletion in certain cases

## Maintenance

### Monitoring

Monitor Cloud Function logs for:
- Deletion success/failure rates
- Common error patterns
- Performance metrics
- Incomplete deletions

### Updates

When adding new collections:
1. Update `cleanupCampaignData()` if campaign-related
2. Update deletion scope in documentation
3. Test thoroughly with existing data

## Support

For issues or questions:
- Check Cloud Function logs in Firebase Console
- Review error messages in component
- Test with development/staging environment first
- Consider adding user feedback mechanism
