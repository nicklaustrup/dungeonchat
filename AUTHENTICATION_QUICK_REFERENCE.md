# Authentication System - Quick Reference

## 🎯 Overview
All users must set a unique username during signup. Email/password users enter it in the signup form, OAuth users set it immediately after authentication.

---

## 📋 Username Rules

| Rule | Value |
|------|-------|
| **Length** | 3-30 characters |
| **Allowed** | Letters (a-z, A-Z), Numbers (0-9), Underscores (_) |
| **Regex** | `/^[a-zA-Z0-9_]{3,30}$/` |
| **Case** | Stored lowercase in index, displayed as entered |
| **Unique** | Must be unique across all users |

---

## 🔐 Authentication Flows

### Email/Password Signup
```
1. User enters: email, username, password
2. Real-time validation on username
3. Form submits only if username is available
4. Profile created with username
5. User enters app (no extra modal)
```

### OAuth Signup (Google/GitHub)
```
1. User clicks OAuth button
2. OAuth authentication completes
3. ProfileSetupModal shows IMMEDIATELY
4. User enters username (REQUIRED, cannot skip)
5. Profile created with username
6. User enters app
```

---

## 🛠️ Key Components

### SignIn.js
```javascript
// State
const [username, setUsername] = useState('');
const [usernameValidation, setUsernameValidation] = useState({
  valid: true,
  message: '',
  checking: false
});

// Validation handler
const handleUsernameChange = async (value) => {
  // Format check
  // Availability check
  // Update validation state
};

// Submit
await signUpWithEmail(email, password, username);
```

### useAuth.js
```javascript
// Updated signature
const signUpWithEmail = async (email, password, username) => {
  // Create Firebase Auth account
  // Create userProfile with username
  // Create username index
};

// New export
const checkUsernameAvailability = async (username) => {
  // Format validation
  // Uniqueness check (Functions or Firestore)
  return { available: boolean, error: string | null };
};
```

### ProfileSetupModal.js
```javascript
// No skip option
<ProfileEditor 
  onSave={handleComplete}
  onCancel={undefined}  // No cancel = no skip
  compact={true}
/>

// Warning message
<p className="setup-note">
  ⚠️ Username is required and cannot be changed later
</p>
```

---

## 📊 Database Schema

### userProfiles/{uid}
```javascript
{
  uid: string,              // Required
  username: string,         // Required, unique
  email: string,           // Required
  displayName: string,      // OAuth only
  profilePictureURL: string,
  authProvider: string,    // 'password' | 'google.com' | 'github.com'
  // ... other fields
}
```

### usernames/{username_lowercase}
```javascript
{
  uid: string,      // Owner's UID
  username: string, // Original (with case)
  createdAt: Date,
  deleted: boolean  // Optional: Soft delete
}
```

---

## ✅ Validation Workflow

```
User types username
    ↓
Format check (client-side)
    ↓
If valid format:
    ↓
Availability check
    ↓
Primary: Firebase Functions
    ↓
Fallback: Firestore query
    ↓
Return: { available, error }
    ↓
Update UI with feedback
```

---

## 🎨 UI States

### Validation Feedback
```jsx
{username && (
  <span className={`field-validation ${usernameValidation.valid ? 'valid' : 'invalid'}`}>
    {usernameValidation.checking ? '⏳ ' : (usernameValidation.valid ? '✓ ' : '✗ ')}
    {usernameValidation.message}
  </span>
)}
```

### CSS Classes
```css
.field-validation.valid {
  color: #28a745;  /* Green */
}

.field-validation.invalid {
  color: #dc3545;  /* Red */
}
```

---

## 🔍 Error Messages

| Condition | Message |
|-----------|---------|
| Empty | "Username is required" |
| Invalid format | "Username must be 3-30 characters (letters, numbers, underscores only)" |
| Taken | "Username is already taken" |
| Checking | "⏳ Checking availability..." |
| Available | "✓ Username available" |
| Error | "Error checking username availability" |

---

## 🚫 Privacy Rules

### ALWAYS Show
✅ Username (user-chosen)
✅ Profile picture (if set)
✅ Bio/status (if set)

### NEVER Show
❌ Email addresses
❌ OAuth display names (Google full name)
❌ Firebase Auth UIDs
❌ Auth provider info

### Implementation
```javascript
// Character sheet
playerName: profileData.username || 'Unknown Player'

// NOT this:
playerName: user?.displayName || user?.email  // WRONG!
```

---

## 🧪 Testing Scenarios

### Test Email Signup
1. Empty username → Error
2. Invalid format → Error
3. Taken username → Error
4. Available username → Success
5. Submit with valid username → Profile created
6. No ProfileSetupModal shown

### Test OAuth Signup
1. Complete OAuth flow
2. ProfileSetupModal appears
3. Cannot dismiss/skip modal
4. Enter invalid username → Error
5. Enter valid username → Profile created
6. Modal closes, app accessible

---

## 📝 Code Snippets

### Check Username Availability
```javascript
const { checkUsernameAvailability } = useAuth();

const result = await checkUsernameAvailability('john_doe');
if (result.available) {
  console.log('Username is available!');
} else {
  console.error(result.error);
}
```

### Create Account with Username
```javascript
const { signUpWithEmail } = useAuth();

try {
  await signUpWithEmail(
    'user@example.com',
    'password123',
    'john_doe'
  );
  // Profile automatically created with username
} catch (error) {
  console.error('Signup failed:', error);
}
```

### Get User Profile
```javascript
const { profile, isProfileComplete, needsOnboarding } = useUserProfile();

if (needsOnboarding) {
  // Show ProfileSetupModal
}

console.log(profile.username); // Display username
```

---

## 🔧 Development Notes

### Environment Setup
- Firebase Auth enabled
- Firestore rules allow userProfiles read/write
- Firebase Functions for checkUsernameAvailability (optional)

### Firestore Indexes
- Collection: `usernames`
- Index on: `username` (ascending)
- Used for uniqueness checks

### Security Rules
```javascript
// userProfiles collection
match /userProfiles/{userId} {
  allow read: if request.auth != null;
  allow write: if request.auth.uid == userId;
}

// usernames collection
match /usernames/{username} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| `SignIn.js` | Signup form with username field |
| `useAuth.js` | Authentication logic + validation |
| `ProfileSetupModal.js` | OAuth username setup |
| `useUserProfile.js` | Profile management |
| `AUTHENTICATION_AUDIT_PLAN.md` | Full audit documentation |
| `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md` | Complete implementation summary |

---

## 🆘 Troubleshooting

### Username validation not working
- Check Firebase Functions deployed
- Verify Firestore indexes created
- Check console for errors

### ProfileSetupModal not showing
- Check `needsOnboarding` value
- Verify user has no username in profile
- Check App.js useEffect logic

### Username taken but shows available
- Clear browser cache
- Check usernames collection directly
- Verify case-insensitive check

### User stuck in ProfileSetupModal
- Cannot skip by design (OAuth users)
- Must enter valid username to proceed
- Check validation state

---

## 📞 Support

For issues or questions:
1. Check `AUTHENTICATION_IMPLEMENTATION_COMPLETE.md` for details
2. Review `AUTHENTICATION_AUDIT_PLAN.md` for architecture
3. Inspect browser console for errors
4. Verify Firebase configuration

---

**Last Updated**: Implementation Complete
**Version**: 1.0
**Status**: ✅ Production Ready
