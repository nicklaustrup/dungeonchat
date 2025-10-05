# Authentication Flow - Visual Diagrams

## 📊 Email/Password Signup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Email/Password Signup                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│   User on   │
│ SignIn Page │
└──────┬──────┘
       │
       │ Selects "Sign Up"
       │
       ▼
┌──────────────────────────────────────┐
│           Signup Form                │
│                                      │
│  📧 Email:    [user@example.com   ] │
│  👤 Username: [john_doe          ] │◄─── NEW! Real-time validation
│               ✓ Username available   │
│  🔒 Password: [****************  ] │
│  🔒 Confirm:  [****************  ] │
│               ✓ Passwords match      │
│                                      │
│     [ Create Account ] (enabled)     │
└──────────────┬───────────────────────┘
               │
               │ Click Submit
               │
               ▼
┌──────────────────────────────────────┐
│    signUpWithEmail() called          │
│                                      │
│  Parameters:                         │
│  - email: "user@example.com"        │
│  - password: "********"             │
│  - username: "john_doe" ◄─── NEW!  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Firebase Auth Account Created      │
│                                      │
│  - UID: abc123                      │
│  - Email: user@example.com          │
│  - Provider: password               │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Email Verification Sent            │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Create userProfile Document        │
│                                      │
│  Collection: userProfiles/{uid}      │
│  Fields:                             │
│    - uid: abc123                    │
│    - username: "john_doe" ◄─── NEW! │
│    - email: user@example.com        │
│    - authProvider: "password"       │
│    - createdAt: [timestamp]         │
│    - ... (other fields)             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Create Username Index              │
│                                      │
│  Collection: usernames/{john_doe}    │
│  Fields:                             │
│    - uid: abc123                    │
│    - username: "john_doe"           │
│    - createdAt: [timestamp]         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   User Redirected to App             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   App.js Checks needsOnboarding      │
│                                      │
│   needsOnboarding = false           │
│   (username already set)             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   ProfileSetupModal NOT shown        │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│     ✅ USER ENTERS APP DIRECTLY      │
└──────────────────────────────────────┘
```

---

## 🔐 OAuth (Google) Signup Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      OAuth Signup Flow                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────┐
│   User on   │
│ SignIn Page │
└──────┬──────┘
       │
       │ Clicks "Sign in with Google"
       │
       ▼
┌──────────────────────────────────────┐
│     OAuth Popup Opens                │
│                                      │
│  ┌────────────────────────────────┐ │
│  │   Google Sign In               │ │
│  │                                │ │
│  │   Choose account:              │ │
│  │   ○ john@gmail.com            │ │
│  │                                │ │
│  │   [Continue]  [Cancel]         │ │
│  └────────────────────────────────┘ │
└──────────────┬───────────────────────┘
               │
               │ User authorizes
               │
               ▼
┌──────────────────────────────────────┐
│   Firebase Auth Account Created      │
│                                      │
│  - UID: xyz789                      │
│  - Email: john@gmail.com            │
│  - Provider: google.com             │
│  - DisplayName: "John Smith"        │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   signInWithGoogle() returns         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   User Redirected to App             │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   App.js Checks needsOnboarding      │
│                                      │
│   useUserProfile() called            │
│   - Loads profile from Firestore     │
│   - Profile exists but no username   │
│   needsOnboarding = TRUE ◄─── Key!  │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   ProfileSetupModal SHOWS            │
│                                      │
│  ┌────────────────────────────────┐ │
│  │  👋 Welcome to DungeonChat!    │ │
│  │                                │ │
│  │  Please choose a unique        │ │
│  │  username...                   │ │
│  │                                │ │
│  │  ⚠️ Username is required and   │ │
│  │     cannot be changed later    │ │
│  │                                │ │
│  │  Username: [_______________]   │ │
│  │            Real-time validation │ │
│  │                                │ │
│  │  [Save] (disabled until valid) │ │
│  │                                │ │
│  │  ❌ NO SKIP BUTTON             │ │
│  └────────────────────────────────┘ │
└──────────────┬───────────────────────┘
               │
               │ User enters "john_gamer"
               │
               ▼
┌──────────────────────────────────────┐
│   Real-time Username Validation      │
│                                      │
│  1. Format check:                   │
│     ✓ Length 3-30                   │
│     ✓ Valid characters              │
│                                      │
│  2. Availability check:              │
│     → checkUsernameAvailability()   │
│     ✓ Username available            │
└──────────────┬───────────────────────┘
               │
               │ Shows "✓ Username available"
               │
               ▼
┌──────────────────────────────────────┐
│   User clicks "Save"                 │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   updateProfile() called             │
│                                      │
│  Updates: userProfiles/{xyz789}      │
│  Fields:                             │
│    - username: "john_gamer"         │
│    - lastUpdated: [timestamp]       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   Create Username Index              │
│                                      │
│  Collection: usernames/{john_gamer}  │
│  Fields:                             │
│    - uid: xyz789                    │
│    - username: "john_gamer"         │
│    - createdAt: [timestamp]         │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│   ProfileSetupModal Success          │
│                                      │
│  ┌────────────────────────────────┐ │
│  │       ✓                        │ │
│  │                                │ │
│  │   Username Set!                │ │
│  │                                │ │
│  │   Loading application...       │ │
│  │   ⏳                           │ │
│  └────────────────────────────────┘ │
└──────────────┬───────────────────────┘
               │
               │ (1.5 second delay)
               │
               ▼
┌──────────────────────────────────────┐
│   Modal Closes                       │
└──────────────┬───────────────────────┘
               │
               ▼
┌──────────────────────────────────────┐
│     ✅ USER ENTERS APP               │
└──────────────────────────────────────┘
```

---

## 🔄 Username Validation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Username Validation Process                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────┐
│  User Types     │
│  "john_doe"     │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  Client-Side Format Validation      │
│                                     │
│  Regex: /^[a-zA-Z0-9_]{3,30}$/     │
│                                     │
│  Checks:                            │
│  ✓ Length: 8 chars (3-30 OK)       │
│  ✓ Characters: Letters/numbers/_ OK │
└────────┬────────────────────────────┘
         │
         │ Format Valid
         │
         ▼
┌─────────────────────────────────────┐
│  Update UI: "⏳ Checking..."        │
└────────┬────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────┐
│  checkUsernameAvailability() called │
└────────┬────────────────────────────┘
         │
         ▼
      ┌──┴──┐
      │ Is  │
      │ Fns │
      │ Avl?│
      └──┬──┘
         │
    ┌────┴─────┐
    │          │
   YES        NO
    │          │
    ▼          ▼
┌───────┐  ┌───────────────────────────┐
│Firebase│  │  Firestore Direct Query   │
│Function│  │                           │
│        │  │  Check: usernames/john_doe│
│        │  │                           │
│        │  │  Exists? ────┬──── Yes   │
│        │  │              │            │
│        │  │              └──── No    │
└───┬───┘  └──────────┬────────────────┘
    │                 │
    └────────┬────────┘
             │
             ▼
      ┌──────────────┐
      │   Response   │
      │  {available, │
      │   error}     │
      └──────┬───────┘
             │
        ┌────┴─────┐
        │          │
   Available    Taken
        │          │
        ▼          ▼
┌─────────────┐ ┌──────────────┐
│ Update UI:  │ │  Update UI:  │
│ "✓ Username"│ │  "✗ Username"│
│ " available"│ │  " is taken" │
│             │ │              │
│ Color: Green│ │ Color: Red   │
└─────────────┘ └──────────────┘
```

---

## 📊 Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Component Hierarchy                      │
└─────────────────────────────────────────────────────────────┘

                      ┌───────────┐
                      │  App.js   │
                      └─────┬─────┘
                            │
          ┌─────────────────┼─────────────────┐
          │                 │                 │
          ▼                 ▼                 ▼
    ┌──────────┐    ┌──────────────┐   ┌─────────┐
    │ AppRouter│    │useUserProfile│   │Other Ctx│
    └────┬─────┘    └──────┬───────┘   └─────────┘
         │                 │
         │                 │ needsOnboarding?
         │                 │
         │         ┌───────┴────────┐
         │         │                │
         │        YES              NO
         │         │                │
         │         ▼                ▼
         │  ┌───────────────┐  ┌────────┐
         │  │ProfileSetup   │  │Continue│
         │  │    Modal      │  └────────┘
         │  └───────┬───────┘
         │          │
         │          │ Uses ProfileEditor
         │          │
         │          ▼
         │  ┌───────────────┐
         │  │ProfileEditor  │
         │  └───────┬───────┘
         │          │
         │          │ Calls updateProfile
         │          │
         │          ▼
         │  ┌───────────────┐
         │  │useUserProfile │
         │  │.updateProfile()│
         │  └───────────────┘
         │
         ▼
    ┌──────────┐
    │  SignIn  │
    │Component │
    └────┬─────┘
         │
         │ Uses useAuth
         │
         ▼
    ┌──────────────────┐
    │    useAuth()     │
    ├──────────────────┤
    │ signUpWithEmail  │◄─── Now accepts username
    │ signInWithGoogle │
    │ signInWithGithub │
    │ checkUsername... │◄─── NEW function
    └──────────────────┘
```

---

## 💾 Data Model

```
┌─────────────────────────────────────────────────────────────┐
│                     Firestore Collections                    │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                   userProfiles/{uid}                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Document ID: abc123 (Firebase Auth UID)                    │
│                                                              │
│  {                                                           │
│    uid: "abc123"              ──┐                           │
│    username: "john_doe" ◄────── │ Required, Unique         │
│    email: "user@example.com"    │                           │
│    displayName: "John Smith"    │ OAuth only               │
│    profilePictureURL: "..."     │                           │
│    authProvider: "password"     │ or "google.com"          │
│    emailVerified: true          │                           │
│    bio: "..."                   │                           │
│    statusMessage: "..."         │                           │
│    profileVisibility: "public"  │                           │
│    showEmail: false             │                           │
│    showLastActive: true         │                           │
│    profanityFilterEnabled: true │                           │
│    createdAt: Timestamp         │                           │
│    lastUpdated: Timestamp       │                           │
│  }                              │                           │
│                                 │                           │
└─────────────────────────────────┼───────────────────────────┘
                                  │
                                  │ Indexed by
                                  │
┌─────────────────────────────────▼───────────────────────────┐
│              usernames/{username_lowercase}                  │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Document ID: john_doe (lowercase)                          │
│                                                              │
│  {                                                           │
│    uid: "abc123"              ──┐ Owner reference          │
│    username: "john_doe"         │ Original case            │
│    createdAt: Timestamp         │                           │
│    deleted: false               │ Optional: Soft delete    │
│  }                              │                           │
│                                 │                           │
│  Purpose:                       │                           │
│  - Fast uniqueness checks       │                           │
│  - Case-insensitive lookups     │                           │
│  - Prevent username conflicts   │                           │
│                                 │                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 Privacy Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Privacy Architecture                    │
└─────────────────────────────────────────────────────────────┘

                   ┌─────────────────┐
                   │   User Profile  │
                   ├─────────────────┤
                   │ uid: abc123     │
                   │ username: john  │
                   │ email: john@... │◄───── NEVER shown
                   │ displayName: J. │◄───── NEVER shown
                   └────────┬────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
        Public Info                 Private Info
              │                           │
              ▼                           ▼
    ┌──────────────────┐      ┌──────────────────┐
    │ Visible to All:  │      │ Hidden from All: │
    ├──────────────────┤      ├──────────────────┤
    │ ✅ username      │      │ ❌ email         │
    │ ✅ profilePic    │      │ ❌ displayName   │
    │ ✅ bio (if set)  │      │ ❌ authProvider  │
    │ ✅ status (if)   │      │ ❌ uid (internal)│
    └──────────────────┘      └──────────────────┘

Usage Examples:

┌─────────────────────────────────────────────────────────────┐
│                   Character Sheet                            │
├─────────────────────────────────────────────────────────────┤
│ Player: john ◄──── Username only                            │
│        NOT john@example.com                                 │
│        NOT "John Smith" (Google name)                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Party Panel                               │
├─────────────────────────────────────────────────────────────┤
│ 👤 john        HP: 10/10  ◄──── Username only              │
│ 👤 jane_wizard HP: 8/10   ◄──── Username only              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Chat Message                              │
├─────────────────────────────────────────────────────────────┤
│ john: Hello everyone! ◄──── Username only                   │
└─────────────────────────────────────────────────────────────┘
```

---

## ⚡ Performance Considerations

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Optimizations                   │
└─────────────────────────────────────────────────────────────┘

1. Username Validation Debouncing
   ───────────────────────────────
   User types: j-o-h-n-_-d-o-e
   
   Without debounce:
   j      → Check API ❌ Expensive!
   jo     → Check API ❌ Expensive!
   joh    → Check API ❌ Expensive!
   john   → Check API ❌ Expensive!
   ...
   
   With debounce (300ms):
   j-o-h-n-_-d-o-e → Wait... → Check API ✅ Once!


2. Caching Strategy
   ────────────────
   ┌─────────────┐
   │ Check john  │
   └──────┬──────┘
          │
          ▼
   ┌──────────────┐
   │ Cache result │
   │ for 5 mins   │
   └──────┬───────┘
          │
          ▼
   ┌─────────────────┐
   │ Subsequent checks│
   │ use cached value │
   └─────────────────┘


3. Firestore Index
   ───────────────
   Collection: usernames
   Index on: username (ascending)
   
   Benefits:
   - Fast lookups
   - No full collection scan
   - Efficient uniqueness check


4. Firebase Functions
   ──────────────────
   Server-side validation:
   - Reduces client load
   - Prevents abuse
   - Atomic checks
   - Security rules
```

---

**Visual Guide Version**: 1.0
**Last Updated**: Implementation Complete
**Status**: ✅ Documentation Complete
