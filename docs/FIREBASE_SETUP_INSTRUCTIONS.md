# Firebase Console Setup Instructions

## 🚀 **Steps to Enable Username Availability Check and Profile Pictures**

### **1. Deploy Firebase Functions**

```bash
cd c:\Users\nlaus\randomcode\firebase_chat\superchat\functions
npm install firebase-functions firebase-admin
firebase deploy --only functions
```

### **2. Update Firestore Security Rules**

1. **Go to Firebase Console**: https://console.firebase.google.com
2. **Select your project** (superchat)
3. **Navigate to Firestore Database**
4. **Click on "Rules" tab**
5. **Replace the current rules** with the content from `firestore-security-rules.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read and write their own profile
    match /userProfiles/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Username collection for availability checking
    // Users can read to check availability, but only Cloud Functions can write
    match /usernames/{username} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions can write to this collection
    }
    
    // Messages collection - users can read all messages and write their own
    match /messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.uid;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    
    // Presence collection - users can read all and write their own
    match /presence/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Deny all other reads/writes
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

6. **Click "Publish"**

### **3. Update Storage Security Rules**

1. **In Firebase Console**, navigate to **Storage**
2. **Click on "Rules" tab**
3. **Replace the current rules** with the content from `storage-security-rules.rules`:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Profile pictures - users can upload/update/delete their own
    match /profile-pictures/{userId}/{allPaths=**} {
      allow read: if true; // Anyone can view profile pictures
      allow write, delete: if request.auth != null && request.auth.uid == userId
        && resource.size < 5 * 1024 * 1024 // 5MB limit
        && resource.contentType.matches('image/.*'); // Only images
    }
    
    // Deny all other storage access
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

4. **Click "Publish"**

### **4. Enable Cloud Functions (if not already enabled)**

1. **Go to Firebase Console** → **Functions**
2. **Click "Get started"** if Functions aren't enabled
3. **Follow the setup wizard**
4. **Ensure billing is enabled** (required for Cloud Functions)

### **5. Install Required Dependencies**

```bash
cd c:\Users\nlaus\randomcode\firebase_chat\superchat
npm install firebase
```

### **6. Test the Implementation**

1. **Start your development server**:
   ```bash
   npm start
   ```

2. **Test username availability**:
   - Sign in to the app
   - Open user menu → Edit Profile
   - Try changing username
   - Should see real-time availability checking

3. **Test profile picture upload**:
   - Click on profile picture in Edit Profile modal
   - Select an image file
   - Should upload to Firebase Storage and update immediately
   - Check Firebase Console → Storage to see uploaded file

### **7. Troubleshooting**

#### **Functions Not Deploying**
```bash
# Make sure you're in the functions directory
cd functions
npm install
firebase deploy --only functions --debug
```

#### **Permission Errors**
- Ensure Firebase project has billing enabled
- Check that security rules are published correctly
- Verify user is authenticated before testing

#### **Storage Upload Errors**
- Check Storage security rules are published
- Ensure file is under 5MB and is an image
- Verify Firebase Storage is enabled in console

### **8. Verify Everything Works**

✅ **Username Availability**: 
- Try existing usernames (should show "taken")
- Try new usernames (should show "available")
- Try invalid formats (should show format error)

✅ **Profile Picture Upload**: 
- Upload should show in user chip immediately
- Check Firebase Console → Storage for uploaded file
- Refresh page - picture should persist

✅ **Profile Display Consistency**: 
- View Profile should show same fields as Edit Profile
- All privacy settings should be visible

---

## 🔧 **Development vs Production**

### **Development Mode**
- Functions may not be available locally
- Fallback validation will be used
- Profile pictures upload to Firebase Storage

### **Production Mode**
- Full server-side username validation
- Complete Firebase integration
- Enhanced security with proper rules

## 📱 **Testing Checklist**

- [ ] Deploy Firebase Functions
- [ ] Update Firestore security rules  
- [ ] Update Storage security rules
- [ ] Test username availability check
- [ ] Test profile picture upload
- [ ] Verify profile display consistency
- [ ] Check user chip updates with new picture
- [ ] Test on mobile devices

---

*Follow these steps in order for full functionality!*