# Firestore Permission Troubleshooting Guide

## Common Permission Errors

When you see errors like:
```
FirebaseError: Missing or insufficient permissions
```

This guide will help you diagnose and fix the issue.

## Quick Diagnosis

### 1. Check Authentication
**Error Pattern:** Happens for all users, including DM
**Solution:** Verify user is signed in
```javascript
if (!auth.currentUser) {
  console.error('User not authenticated');
}
```

### 2. Check Campaign Membership
**Error Pattern:** Works for DM, fails for players
**Solution:** Verify user is in campaign members collection
```javascript
// Check in Firestore Console:
campaigns/{campaignId}/members/{userId}
```

### 3. Check Security Rules
**Error Pattern:** Works in some contexts, fails in others
**Solution:** Review security rules for the specific collection

## Common Rule Patterns

### Pattern 1: Campaign Member Check
```javascript
// Check if user is a campaign member
exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid))
```

**Common Issues:**
- ❌ Wrong path (missing `/databases/$(database)/documents`)
- ❌ Using `resource.auth.uid` instead of `request.auth.uid`
- ❌ Not checking `request.auth != null` first

**Fix:**
```javascript
allow read: if request.auth != null && 
  exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
```

### Pattern 2: Helper Functions
```javascript
// Define once, use everywhere
function isCampaignMember() {
  return request.auth != null && 
    exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
}

// Usage
allow read: if isCampaignMember();
allow create: if isCampaignMember();
```

### Pattern 3: DM Check
```javascript
// Check if user is the campaign DM
request.auth.uid == get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId
```

**Common Issues:**
- ❌ Not using `get()` to fetch campaign document
- ❌ Wrong field name (dmId vs dungeomMasterId)
- ❌ Checking resource.data instead of get().data

**Fix:**
```javascript
allow delete: if request.auth != null && 
  request.auth.uid == get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId;
```

### Pattern 4: Own Data Check
```javascript
// User can only modify their own data
allow update: if request.auth != null && 
  request.auth.uid == userId;
```

## Collection-Specific Rules

### Voice Rooms
```javascript
match /campaigns/{campaignId}/voiceRooms/{roomId} {
  // Members can create and join
  allow create, update: if isCampaignMember();
  
  // Members can read
  allow read: if isCampaignMember();
  
  // DM or creator can delete
  allow delete: if request.auth != null && 
    (request.auth.uid == get(...).data.dmId || 
     request.auth.uid == resource.data.createdBy);
}
```

### Character Sheets
```javascript
match /campaigns/{campaignId}/characters/{userId} {
  // Members can read all sheets
  allow read: if isCampaignMember();
  
  // Users can edit their own
  allow create, update: if request.auth != null && 
    request.auth.uid == userId && 
    isCampaignMember();
  
  // DM can edit any
  allow update: if isDM();
}
```

### Initiative Tracker
```javascript
match /campaigns/{campaignId}/sessions/initiative {
  // Members can read
  allow read: if isCampaignMember();
  
  // DM can fully manage
  allow create, update, delete: if isDM();
  
  // Members can update to add themselves
  allow update: if isCampaignMember();
}
```

## Testing Security Rules

### Local Testing
```bash
# Start emulators with security rules
firebase emulators:start

# Test specific rules
firebase emulators:exec --only firestore "npm test"
```

### Console Testing
1. Go to Firestore Console
2. Navigate to Rules tab
3. Click "Rules Playground"
4. Test read/write operations

### Client Testing
```javascript
// Enable Firestore logging
firebase.firestore.setLogLevel('debug');

// Check auth state
console.log('Auth:', auth.currentUser);

// Check document existence
const memberDoc = await firestore
  .collection('campaigns')
  .doc(campaignId)
  .collection('members')
  .doc(userId)
  .get();
  
console.log('Is member:', memberDoc.exists);
```

## Common Fixes

### Fix 1: Add Campaign Member Check
**Before:**
```javascript
allow read: if request.auth != null;
```

**After:**
```javascript
allow read: if request.auth != null && 
  exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid));
```

### Fix 2: Allow Members to Create
**Before:**
```javascript
allow create: if request.auth.uid == get(...).data.dmId;
```

**After:**
```javascript
allow create: if isCampaignMember();
```

### Fix 3: Allow Self-Update
**Before:**
```javascript
allow update: if request.auth.uid == get(...).data.dmId;
```

**After:**
```javascript
allow update: if request.auth != null && 
  (request.auth.uid == userId || isDM());
```

## Debugging Workflow

1. **Check Browser Console**
   - Look for FirebaseError details
   - Note which collection/document failed

2. **Check Firestore Rules**
   - Find the relevant `match` statement
   - Verify conditions match your use case

3. **Check Authentication**
   - Verify user is signed in
   - Check user.uid matches expected value

4. **Check Data Structure**
   - Verify campaign member document exists
   - Check field names match (dmId, userId, etc.)

5. **Test in Isolation**
   - Try reading the specific document in console
   - Check if it's a read or write permission issue

6. **Add Logging**
   ```javascript
   console.log('Attempting to access:', {
     collection: 'voiceRooms',
     campaignId,
     userId: auth.currentUser?.uid
   });
   ```

7. **Deploy and Test**
   ```bash
   firebase deploy --only firestore:rules
   ```

## Error Messages Decoded

### "Missing or insufficient permissions"
**Meaning:** Security rule denied the operation
**Fix:** Check and update security rules

### "Cannot read property 'data' of undefined"
**Meaning:** Document doesn't exist or wrong path
**Fix:** Verify document path and existence

### "Function get() requires a valid document path"
**Meaning:** Invalid path in get() call
**Fix:** Use full path: `/databases/$(database)/documents/...`

### "Cannot access member 'uid' of undefined"
**Meaning:** request.auth is null
**Fix:** Add `request.auth != null` check first

## Best Practices

1. ✅ **Always check authentication first**
   ```javascript
   if request.auth != null
   ```

2. ✅ **Use helper functions**
   ```javascript
   function isCampaignMember() { ... }
   ```

3. ✅ **Test rules before deploying**
   ```bash
   firebase emulators:start
   ```

4. ✅ **Be specific with permissions**
   - Don't use `allow read, write: if true;`
   - Specify create, read, update, delete separately

5. ✅ **Document complex rules**
   ```javascript
   // Allow members to update initiative
   // but only add their own character
   allow update: if ...
   ```

6. ✅ **Consider performance**
   - Minimize `get()` calls
   - Cache membership checks in client

## Quick Reference

### Check if Campaign Member
```javascript
exists(/databases/$(database)/documents/campaigns/$(campaignId)/members/$(request.auth.uid))
```

### Check if DM
```javascript
request.auth.uid == get(/databases/$(database)/documents/campaigns/$(campaignId)).data.dmId
```

### Check if Own Data
```javascript
request.auth.uid == userId
```

### Check if Authenticated
```javascript
request.auth != null
```

## Getting Help

If you're still stuck:
1. Check Firebase Console logs
2. Test in Rules Playground
3. Review [Firebase Security Rules docs](https://firebase.google.com/docs/firestore/security/get-started)
4. Check this project's `firestore.rules` file for examples
