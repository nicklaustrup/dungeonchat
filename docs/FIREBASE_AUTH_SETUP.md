# Firebase Authentication Setup Guide

This guide will help you enable email/password and GitHub authentication in your Firebase project.

## Prerequisites

- Firebase project created
- Firebase project connected to your app (firebase.json configured)
- Admin access to Firebase console

## Step 1: Access Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`superchat` or your project name)
3. Navigate to **Authentication** in the left sidebar
4. Click on the **Sign-in method** tab

## Step 2: Enable Email/Password Authentication

1. In the Sign-in method tab, find **Email/Password**
2. Click on **Email/Password**
3. Toggle **Enable** to turn it on
4. Optionally toggle **Email link (passwordless sign-in)** if you want passwordless login
5. Click **Save**

## Step 3: Enable GitHub Authentication (Optional)

1. In the Sign-in method tab, find **GitHub**
2. Click on **GitHub**
3. Toggle **Enable** to turn it on
4. You'll need to set up a GitHub OAuth App:

### GitHub OAuth App Setup:
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in the application details:
   - **Application name**: `Superchat` (or your preferred name)
   - **Homepage URL**: `http://localhost:3000` (for development)
   - **Authorization callback URL**: Use the URL provided by Firebase (something like `https://your-project.firebaseapp.com/__/auth/handler`)
4. Click **Register application**
5. Copy the **Client ID** and **Client Secret**
6. Paste these into the Firebase GitHub configuration
7. Click **Save** in Firebase

## Step 4: Update Authorized Domains (if needed)

1. In the Authentication section, click on **Settings** tab
2. Scroll down to **Authorized domains**
3. Make sure `localhost` is in the list for development
4. Add your production domain when you deploy

## Step 5: Test the Authentication

1. Save all changes in Firebase Console
2. Return to your app at `http://localhost:3000`
3. Try creating an account with email/password
4. Try signing in with Google (should already work)
5. Try signing in with GitHub (if you set it up)

## Common Issues

### `auth/operation-not-allowed`
- **Cause**: The authentication method is not enabled in Firebase Console
- **Solution**: Follow steps above to enable Email/Password or GitHub authentication

### `auth/popup-blocked`
- **Cause**: Browser is blocking the OAuth popup
- **Solution**: Allow popups for localhost in browser settings

### `auth/account-exists-with-different-credential`
- **Cause**: User is trying to sign in with a different method than they used to create the account
- **Solution**: Use the original sign-in method or implement account linking

### Invalid OAuth Configuration
- **Cause**: GitHub OAuth app not configured correctly
- **Solution**: Double-check the callback URL and client credentials

## Production Deployment

When deploying to production:

1. Update GitHub OAuth app with production URL
2. Add production domain to Firebase authorized domains
3. Update environment variables if using them
4. Test all authentication methods in production

## Security Notes

- Never commit OAuth client secrets to version control
- Use environment variables for sensitive configuration
- Enable only the authentication methods you need
- Regularly review and rotate OAuth credentials
- Monitor authentication logs for suspicious activity

## Testing

After setup, you should be able to:
- ✅ Sign up with email/password
- ✅ Sign in with email/password  
- ✅ Reset password via email
- ✅ Sign in with Google
- ✅ Sign in with GitHub (if configured)

If you encounter any issues, check the browser console and Firebase Console logs for error details.