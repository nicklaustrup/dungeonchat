# Profile Picture Bug Fix - Campaign Members

## The Problem
Profile pictures were not displaying for campaign members despite the caching system being in place.

## Root Causes

### Bug #1: Incorrect Destructuring in MemberItem Component
**Location**: `CampaignMemberList.js` line 73

**Wrong**:
```javascript
const { profile } = useCachedUserProfileData(member.userId);
```

**Correct**:
```javascript
const { profileData } = useCachedUserProfileData(member.userId);
```

**Why it failed**: The `useCachedUserProfileData` hook returns an object with a `profileData` property, not `profile`. When we destructured it incorrectly, `profile` was undefined, so `profile?.profilePictureURL` always returned undefined.

### Bug #2: Wrong Field Name in useCampaignMembers Hook
**Location**: `useCampaignMembers.js` line 38

**Wrong**:
```javascript
memberData.photoURL = profileData.photoURL || null;
```

**Correct**:
```javascript
memberData.photoURL = profileData.profilePictureURL || profileData.photoURL || null;
```

**Why it failed**: The Firestore `userProfiles` collection stores the profile picture in the `profilePictureURL` field, not `photoURL`. The hook was looking at the wrong field name.

## The Fix

### Changes Made

1. **Fixed CampaignMemberList.js**:
   - Corrected destructuring to use `profileData` instead of `profile`
   - Added fallback chain: `profileData?.profilePictureURL || profileData?.photoURL || member.photoURL`
   - Added debug logging to trace data flow
   - Added loading state check

2. **Fixed useCampaignMembers.js**:
   - Updated to check `profilePictureURL` first, then fall back to `photoURL`
   - Maintains backward compatibility with any legacy data

3. **Added Debug Logging**:
   - Logs profile data for each member to console
   - Shows which fields have values
   - Can be removed after verification

## Testing

To verify the fix works:

1. Open the Campaign Dashboard
2. Navigate to the Members tab
3. Check browser console for debug logs showing profile data
4. Verify profile pictures display for members with uploaded photos
5. Verify role icons display for members without photos
6. Click on usernames to open profile modals

## Debug Console Output

You should see logs like:
```
Profile data for userId123: {
  profilePictureURL: "https://...",
  photoURL: undefined,
  memberPhotoURL: "https://...",
  username: "strupnick",
  displayName: "Nick"
}
```

## Data Flow

```
1. useCampaignMembers fetches member data + basic profile info
   ├─ Sets member.photoURL from profileData.profilePictureURL
   └─ Caches member data

2. MemberItem component renders each member
   ├─ Calls useCachedUserProfileData(userId)
   ├─ Gets { profileData } from cache
   ├─ Checks profileData.profilePictureURL
   ├─ Falls back to profileData.photoURL
   ├─ Falls back to member.photoURL
   └─ Renders image or role icon

3. Click on username
   ├─ e.stopPropagation() prevents event bubbling
   ├─ Opens UserProfileModal with userId
   └─ Modal uses same cached profile data
```

## Related Files
- `src/components/Campaign/CampaignMemberList.js` - Fixed destructuring
- `src/hooks/useCampaignMembers.js` - Fixed field name
- `src/services/cache/useCachedUserProfileData.js` - Returns profileData
- `src/services/cache/useCachedUserProfile.js` - Defines profilePictureURL field

## Future Improvements

1. **Remove Debug Logging**: After verification, remove console.log statements
2. **Standardize Field Names**: Consider migrating all code to use `profilePictureURL` consistently
3. **Add Loading States**: Show skeleton loader while profile data loads
4. **Error Handling**: Add error state display if profile fetch fails
