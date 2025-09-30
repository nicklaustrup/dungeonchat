# User Profile Enhancement Plan

## Overview
This document outlines the plan to enhance the user profile experience in Superchat by adding multiple authentication methods and customizable user profiles. Currently, the app only supports Google OAuth with basic profile display. The goal is to create a comprehensive user profile system that allows custom usernames, profile pictures, and multiple sign-in options.

## Current State Analysis

### Existing Authentication System
- **Method**: Google OAuth only (popup flow)
- **Provider**: Firebase Authentication with `GoogleAuthProvider`
- **Storage**: User data stored in Firebase Auth user object
- **Profile Data**: Limited to Google account info (displayName, email, photoURL)

### Current User Profile Features
- Basic profile modal displaying:
  - Google display name
  - Google email
  - Google profile picture (with fallback avatar)
  - Presence status (online/away/offline)
  - Last active timestamp
- User profiles stored in `userProfiles` collection (currently only for profanity filter preference)
- Firestore security rules allow users to read/write their own profiles

### Current Profile Display Locations
1. **UserProfileModal**: Full profile view with presence information
2. **UserMenu**: Header dropdown with avatar, name, email
3. **ChatMessage**: Username display with clickable profile access
4. **MessageHeader**: Username in message headers

## Enhancement Goals

### Single Phase Implementation (Test Environment)
Since we're in a test phase with database reset capability, we can implement all features simultaneously:

1. **Multi-Authentication Support**
   - Email/password registration and sign-in
   - Email verification and password reset
   - Google OAuth (existing)
   - GitHub OAuth (developer-friendly)

2. **Complete Custom Profile System**
   - Unique username requirement with real-time validation
   - Custom display names separate from auth names
   - Profile picture uploads with processing
   - Bio and status message fields
   - Privacy controls

3. **Modern Profile Management UI**
   - Unified sign-in/sign-up modal
   - Comprehensive profile editing interface
   - Real-time username availability checking
   - Profile picture upload with cropping
   - Settings management

4. **Enhanced User Experience**
   - Profile-first approach (custom usernames in chat)
   - Rich profile displays
   - User search by username
   - Profile customization options

## Technical Implementation Plan

### 1. Database Schema Updates

#### Enhanced User Profiles Collection (`userProfiles/{uid}`)
```javascript
{
  // Core identity
  uid: string,
  username: string, // unique, indexed, 3-30 chars
  displayName: string, // can be different from auth displayName
  email: string, // primary email from auth
  
  // Profile content
  bio: string, // max 500 chars
  statusMessage: string, // max 100 chars
  profilePictureURL: string, // custom uploaded image
  
  // Authentication info
  authProvider: string, // 'google.com', 'password', 'github.com'
  emailVerified: boolean,
  
  // Privacy settings
  profileVisibility: 'public' | 'private', // simplified
  showEmail: boolean,
  showLastActive: boolean,
  
  // Timestamps
  createdAt: timestamp,
  lastUpdated: timestamp,
  
  // Legacy settings (can be removed in future)
  profanityFilterEnabled: boolean // keep for now
}
```

#### Username Index Collection (`usernames/{username}`)
```javascript
{
  uid: string,
  createdAt: timestamp
}
```

### 2. Authentication Enhancements

#### Firebase Service Updates (`src/services/firebase.js`)
```javascript
// Add new auth imports
import { 
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  linkWithCredential,
  unlink
} from 'firebase/auth';

// Export new auth methods
export {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  linkWithCredential,
  unlink
};
```

#### Enhanced Firebase Context (`src/services/FirebaseContext.js`)
```javascript
const value = {
  // Existing
  auth,
  firestore,
  rtdb,
  storage,
  user,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  
  // New auth methods
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
  linkWithCredential,
  unlink
};
```

### 3. New Components and Hooks

#### New Authentication Components
1. **`SignInModal`** - Unified sign-in interface
   - Tab switching between Google OAuth and Email/Password
   - Form validation and error handling
   - "Forgot Password" and "Create Account" links

2. **`SignUpForm`** - Email/password registration
   - Email and password validation
   - Terms of service acceptance
   - Email verification flow

3. **`ForgotPasswordForm`** - Password reset interface
   - Email input for reset link
   - Success/error messaging

#### Enhanced Profile Components
1. **`EditableUserProfile`** - Enhanced profile modal with edit capabilities
   - Toggle between view and edit modes
   - Form validation for profile fields
   - Image upload component
   - Username availability checking

2. **`ProfilePictureUpload`** - Avatar upload interface
   - Drag and drop support
   - Image cropping functionality
   - File size and type validation
   - Progress indicator

3. **`UsernameField`** - Username input with validation
   - Real-time availability checking
   - Username format validation
   - Debounced API calls

#### New Hooks
1. **`useAuth`** - Enhanced authentication hook
   - Multiple sign-in methods
   - Account linking functionality
   - Email verification status

2. **`useProfile`** - Enhanced profile management hook
   - Profile CRUD operations
   - Username validation and checking
   - Profile picture upload handling

3. **`useImageUpload`** - File upload utility hook
   - Firebase Storage integration
   - Image processing and compression
   - Upload progress tracking

### 4. Security and Validation

#### Firestore Security Rules Updates
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Enhanced user profiles
    match /userProfiles/{userId} {
      allow read: if request.auth != null && (
        resource.data.profileVisibility == 'public' ||
        request.auth.uid == userId ||
        request.auth.token.firebase.sign_in_provider == 'custom'
      );
      allow write: if request.auth != null && request.auth.uid == userId
        && validateUserProfile(request.resource.data);
      allow create: if request.auth != null && request.auth.uid == userId
        && validateUserProfile(request.resource.data);
    }
    
    // Username uniqueness enforcement
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.uid == request.auth.uid
        && validateUsername(username);
      allow delete: if request.auth != null 
        && resource.data.uid == request.auth.uid;
    }
    
    // Messages (updated to use custom displayName)
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null 
        && request.resource.data.uid == request.auth.uid
        && validateMessageData(request.resource.data);
      // ... existing rules
    }
  }
  
  function validateUserProfile(data) {
    return data.keys().hasAny(['username', 'displayName', 'bio', 'statusMessage']) &&
           ((!('username' in data)) || (data.username is string && data.username.size() <= 30)) &&
           ((!('bio' in data)) || (data.bio is string && data.bio.size() <= 500)) &&
           ((!('statusMessage' in data)) || (data.statusMessage is string && data.statusMessage.size() <= 100));
  }
  
  function validateUsername(username) {
    return username.matches('^[a-zA-Z0-9_]{3,30}$');
  }
}
```

#### Cloud Functions for Profile Management
```javascript
// Username validation and cleanup
exports.validateUsername = functions.firestore
  .document('userProfiles/{uid}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();
    
    // Handle username changes
    if (before.username !== after.username) {
      // Validate new username
      // Update username index
      // Clean up old username entry
    }
  });

// Profile picture processing
exports.processProfilePicture = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Resize and optimize uploaded profile pictures
    // Generate thumbnails
    // Update user profile with processed image URLs
  });
```

### 5. UI/UX Enhancements

#### Sign-In Flow Redesign
1. **Landing Experience**: Update sign-in to show multiple options
2. **Progressive Enhancement**: Start with Google OAuth, add email/password as secondary option
3. **Account Linking**: Allow users to connect multiple auth methods
4. **Onboarding**: Guide new users through profile setup

#### Profile Management Interface
1. **Inline Editing**: Click-to-edit functionality for profile fields
2. **Real-time Validation**: Immediate feedback on username availability
3. **Profile Preview**: Show how profile appears to others
4. **Settings Organization**: Logical grouping of profile and privacy settings

### 6. Implementation Strategy

#### Single Phase Development (1-2 Weeks)
Since we can reset the database, we'll implement everything at once:

**Week 1: Core Infrastructure**
1. Set up enhanced authentication (email/password + GitHub)
2. Create new user profile schema and hooks
3. Build unified sign-in/sign-up interface
4. Implement username validation system

**Week 2: Profile Features & UI**
1. Profile picture upload and processing
2. Enhanced profile editing interface  
3. Update all components to use custom usernames/profiles
4. Testing and refinement

#### Development Approach
- **Database First**: Design clean schema without legacy constraints
- **Component Updates**: Update existing components to use custom profile data
- **Modern UX**: Build intuitive profile management from scratch
- **Comprehensive Testing**: Test all flows in isolation

### 7. Testing Strategy

#### Unit Tests
- Authentication service methods
- Profile validation functions
- Username availability checking
- Image upload utilities

#### Integration Tests
- Complete sign-up flow
- Profile editing workflows
- Multi-provider account linking
- Database rule enforcement

#### E2E Tests
- User registration and verification
- Profile customization flows
- Cross-device authentication state
- Performance under load

## Risk Assessment and Mitigation

### Technical Risks
1. **Username Uniqueness**: Race conditions in username claiming
   - **Mitigation**: Use Firestore transactions and indexed username collection

2. **Profile Picture Storage**: Large file uploads affecting performance
   - **Mitigation**: Client-side compression, file size limits, CDN optimization

3. **Authentication State**: Complex multi-provider state management
   - **Mitigation**: Comprehensive testing, fallback mechanisms, clear error handling

### User Experience Risks
1. **Learning Curve**: New interface patterns for existing testers
   - **Mitigation**: Intuitive design, clear onboarding flow

2. **Username Conflicts**: Multiple testers wanting the same username  
   - **Mitigation**: First-come-first-served, suggestion system

### Security Risks
1. **Profile Data Exposure**: Inadequate privacy controls
   - **Mitigation**: Privacy-by-default design, robust Firestore rules

2. **Image Upload Abuse**: Inappropriate profile pictures
   - **Mitigation**: File type/size validation, basic content filtering

## Success Metrics

### User Engagement
- Profile completion rates
- Custom username adoption
- Profile picture upload rates
- User retention post-enhancement

### Technical Performance
- Authentication success rates
- Profile load times
- Image upload success rates
- Database query performance

### User Satisfaction
- User feedback on new features
- Support ticket volume
- Feature usage analytics
- User survey responses

## Conclusion

This enhanced implementation plan takes advantage of the test environment to build a modern, comprehensive user profile system from the ground up. Without backwards compatibility constraints, we can implement clean architecture patterns, modern UX flows, and efficient database design.

The single-phase approach allows us to:
- **Move fast** without complex migration logic
- **Test comprehensively** with the full feature set
- **Iterate quickly** based on user feedback 
- **Build modern patterns** without legacy constraints

The implementation will transform Superchat from a simple Google OAuth chat into a platform with rich user identity, customization, and multiple authentication options.

## Next Steps

1. **Start Implementation**: Begin with authentication enhancements
2. **Database Setup**: Design and implement the new profile schema
3. **Component Development**: Build the new profile management interfaces
4. **Testing**: Comprehensive testing with fresh data
5. **User Feedback**: Gather insights from testers on the new experience

Ready to begin implementation? Let's start with the authentication system enhancements and then move through the profile features systematically.