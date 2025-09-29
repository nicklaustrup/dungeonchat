# Profanity Filter Enhancement - User Control Feature

## Overview

Enhanced the profanity filter functionality to give users control over whether they want profanity filtered in messages they view. This change makes the chat application more mature-user friendly while maintaining safety features.

## Changes Made

### 1. **User Profile Management Hook** (`src/hooks/useUserProfile.js`)
- Created a new hook to manage user preferences in Firestore
- Automatically creates user profiles with default settings for new users
- Handles profanity filter preference toggle
- Default setting: **profanity filter enabled** for new users

### 2. **Firebase Function Updates** (`functions/index.js`)
- Modified `detectEvilUsers` function to check user preferences before filtering
- **Disabled banning functionality** (commented out for future re-enablement)
- Respects user's profanity filter setting:
  - If disabled: message passes through unchanged
  - If enabled: message is replaced with "[removed: profanity]"

### 3. **Settings Modal Enhancement** (`src/components/SettingsModal/SettingsModal.js`)
- Added profanity filter toggle control
- Icon indicators: 🛡️ (enabled) / 🔓 (disabled)
- Integrated with user profile hook for real-time updates

### 4. **Firestore Rules Update** (`firestore.rules`)
- Added Firebase Functions access to read user profiles for moderation
- Maintains user privacy (users can only edit their own profiles)

## User Experience

### For New Users
- Profanity filter is **enabled by default**
- User profile is automatically created on first app use

### For Existing Users
- Can toggle profanity filter in Settings
- Setting is persistent across sessions
- Immediate effect on new messages

### Settings Location
1. Click user avatar/name in header
2. Select "Settings"
3. Toggle "Profanity Filter" setting

## Technical Details

### Data Structure
```js
// User Profile Document (/userProfiles/{uid})
{
  uid: "user123",
  profanityFilterEnabled: true,
  createdAt: Date,
  lastUpdated: Date
}
```

### Firebase Function Flow
1. New message created
2. Check for profanity using leo-profanity package
3. If profanity detected:
   - Fetch user profile
   - Check `profanityFilterEnabled` setting
   - If enabled: replace message text
   - If disabled: leave message unchanged
4. Log action (no user banning)

### Security & Privacy
- Users can only read/write their own profiles
- Firebase Functions can read profiles for moderation
- No sensitive data stored in profiles
- Profanity checking happens server-side

## Future Enhancements

### Re-enable Banning (Optional)
The banning functionality is commented out in the Firebase function. To re-enable:

```js
// Uncomment in functions/index.js
await db.collection("banned").doc(uid).set({
  bannedAt: admin.firestore.FieldValue.serverTimestamp(),
  reason: "profanity",
});
```

### Additional Settings
- Profanity replacement text customization
- Severity level settings
- Word whitelist/blacklist

### Moderation Features
- Admin override capabilities
- Moderation dashboard
- Appeal system

## Testing

### Manual Testing Steps
1. **New User Flow:**
   - Sign in with new account
   - Check Settings → Profanity Filter is ON
   - Send profane message → gets filtered

2. **Toggle Functionality:**
   - Turn off profanity filter in Settings
   - Send profane message → passes through
   - Turn on filter → subsequent messages get filtered

3. **Persistence:**
   - Change setting, refresh page
   - Setting should be remembered

### Automated Tests
- User profile hook functionality
- Settings modal integration
- Firebase function logic

## Deployment Notes

1. **Deploy Firebase Functions:**
   ```bash
   cd functions && npm run deploy
   ```

2. **Update Firestore Rules:**
   ```bash
   firebase deploy --only firestore:rules
   ```

3. **Deploy Frontend:**
   ```bash
   npm run build && firebase deploy --only hosting
   ```

## Monitoring

### Logs to Watch
- Firebase Functions logs for profanity detection
- User profile creation/updates
- Setting toggle success/failures

### Metrics to Track
- Percentage of users with filter enabled/disabled
- Profanity detection frequency
- User setting change patterns

---

**Status**: ✅ Ready for deployment
**Impact**: Enhanced user control, improved mature user experience
**Breaking Changes**: None (backward compatible)