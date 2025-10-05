# Authentication Workflow Audit & Implementation Plan

## Current State Analysis

### Authentication Components
- **SignIn.js**: Handles email/password and OAuth authentication
- **useAuth.js**: Firebase authentication hook with signUpWithEmail, signInWithGoogle, signInWithGithub
- **useUserProfile.js**: Manages userProfiles collection, username validation, profile completion
- **ProfileSetupModal.js**: Post-authentication username setup modal (shows when needsOnboarding = true)
- **ProfileEditor.js**: Profile editing interface with username validation

### Current Authentication Flow

#### Email/Password Signup
1. User enters email + password in SignIn.js
2. `signUpWithEmail()` called → Firebase Auth account created
3. Email verification sent
4. User redirected to app
5. App.js detects `needsOnboarding = true` (no username set)
6. ProfileSetupModal shown with ProfileEditor
7. User enters username → validated → saved to userProfiles

#### OAuth Signup (Google/GitHub)
1. User clicks OAuth button in SignIn.js
2. `signInWithGoogle()` or `signInWithGithub()` called
3. OAuth popup → Firebase Auth account created
4. User redirected to app
5. App.js detects `needsOnboarding = true` (no username set)
6. ProfileSetupModal shown with ProfileEditor
7. User enters username → validated → saved to userProfiles

### Problems Identified

❌ **Email/Password Signup**: Username is NOT collected during signup
❌ **OAuth Signup**: Username is NOT required immediately after auth
❌ **Inconsistency**: Username setup happens AFTER authentication, not during/immediately after
❌ **User Experience**: Extra modal step after authentication is jarring

### Solution Requirements

✅ **Email/Password**: Add username field to signup form, validate before account creation
✅ **OAuth**: Show username setup modal/screen IMMEDIATELY after OAuth callback
✅ **Validation**: Username uniqueness check before profile creation
✅ **Storage**: Username saved to userProfiles during initial profile creation
✅ **Consistency**: Username used throughout app (already verified in CharacterCreationModal)

## Implementation Plan

### Phase 1: Email/Password Signup Enhancement ✅ IMPLEMENTED

**File**: `src/components/SignIn/SignIn.js`

**Changes**:
1. Add username state field
2. Add username input to signup form (between email and password)
3. Add real-time username validation during typing
4. Validate username before calling `signUpWithEmail()`
5. Pass username to `signUpWithEmail()` function

**File**: `src/hooks/useAuth.js`

**Changes**:
1. Update `signUpWithEmail(email, password)` → `signUpWithEmail(email, password, username)`
2. After Firebase Auth account creation, immediately create userProfile with username
3. Call `setDoc(doc(firestore, 'userProfiles', user.uid), { username, ... })`

### Phase 2: OAuth Username Setup Enhancement ✅ IMPLEMENTED

**File**: `src/components/ProfileSetupModal/ProfileSetupModal.js`

**Changes**:
1. Make username requirement non-skippable (remove skip button entirely)
2. Update messaging to indicate this is a one-time required setup
3. Prevent closing modal until username is set

**File**: `src/hooks/useUserProfile.js`

**Changes**:
1. Update profile creation logic in useEffect
2. Set `needsOnboarding = true` for OAuth users without username
3. Ensure ProfileSetupModal shows immediately after OAuth login

### Phase 3: Username Uniqueness Validation ✅ ALREADY IMPLEMENTED

**File**: `src/hooks/useUserProfile.js`

**Current Implementation**:
- `checkUsernameAvailability()` function exists
- Uses Firebase Functions for server-side validation
- Checks usernames collection for conflicts
- Returns { available: boolean, error: string }

**Status**: Already complete, just need to integrate with signup form

### Phase 4: Campaign Join Flow Audit 🔄 NEXT STEP

**Objective**: Remove redundant character/display name prompts during campaign join

**Files to Investigate**:
- Campaign invitation/join modals
- Campaign member creation logic
- Character creation flow during campaign join

**Actions**:
- [ ] Find campaign invite acceptance components
- [ ] Check if username is used for member display
- [ ] Remove any prompts for "display name" or "character name" during join
- [ ] Ensure username from userProfiles is used automatically

## Testing Checklist

### Email/Password Signup
- [ ] Username field appears in signup form
- [ ] Username validation works (format + uniqueness)
- [ ] Invalid usernames show error messages
- [ ] Valid usernames show success indicator
- [ ] Account creation fails if username is invalid
- [ ] Profile is created with username after signup
- [ ] No ProfileSetupModal shown after signup (username already set)

### OAuth Signup (Google)
- [ ] OAuth authentication succeeds
- [ ] ProfileSetupModal appears immediately after auth
- [ ] Username field is required (cannot skip)
- [ ] Username validation works in modal
- [ ] Profile is created with username after setup
- [ ] User can access app after username is set

### Username Usage
- [ ] Character sheets show username in Player field
- [ ] Campaign member lists show username
- [ ] Chat messages show username
- [ ] Party panel shows username
- [ ] No email addresses or Google displayNames shown anywhere

### Campaign Join Flow
- [ ] Campaign invite acceptance doesn't prompt for name
- [ ] Username from userProfiles is used automatically
- [ ] Member list shows correct username

## Security Considerations

### Username Validation Rules
- **Format**: 3-30 characters, alphanumeric + underscores only
- **Uniqueness**: Checked against usernames collection
- **Case-insensitive**: Stored lowercase in index, displayed as entered
- **Server-side validation**: Uses Firebase Functions when available

### Data Privacy
- ✅ Email addresses never displayed in UI
- ✅ OAuth displayName (Google full name) never displayed
- ✅ Only username visible to other users
- ✅ Character sheet Player field shows username only

## Implementation Status

### Completed ✅
- Character avatar priority logic (avatarUrl → photoURL → portraitUrl → placeholder)
- Character player name privacy (username only, no email/displayName)
- Username validation infrastructure (checkUsernameAvailability function)
- Profile creation with username field in userProfiles collection

### In Progress 🔄
- Email/password signup form enhancement (adding username field)
- OAuth username setup modal enforcement (removing skip option)

### Pending ⏳
- Campaign join flow audit
- Username consistency verification across all UI components
- Integration testing for both auth flows

## Next Steps

1. **Implement Phase 1**: Add username field to SignIn.js signup form
2. **Implement Phase 2**: Enhance ProfileSetupModal for OAuth users
3. **Test both flows**: Email signup and OAuth signup
4. **Audit campaign join**: Find and fix any redundant name prompts
5. **Verify app-wide**: Ensure username is used consistently everywhere
6. **Update TODO.md**: Mark completed tasks, add any new findings

## Files Modified

- `src/components/SignIn/SignIn.js` - Add username to signup form
- `src/hooks/useAuth.js` - Update signUpWithEmail to accept username parameter
- `src/components/ProfileSetupModal/ProfileSetupModal.js` - Remove skip option, enforce username
- `src/hooks/useUserProfile.js` - Ensure OAuth users trigger ProfileSetupModal

## Expected User Experience

### New User (Email/Password)
1. Visit sign-up page
2. Enter email, username, password, confirm password
3. See real-time username validation feedback
4. Click "Create Account"
5. Receive email verification
6. Sign in and immediately access app (no profile setup modal)

### New User (OAuth)
1. Click "Sign in with Google"
2. Complete OAuth flow
3. IMMEDIATELY see ProfileSetupModal with username requirement
4. Enter username with validation
5. Click "Complete Setup"
6. Access app (no additional steps)

### Existing User
- No changes, existing profiles remain intact
- If somehow username is missing, ProfileSetupModal will appear on next login
