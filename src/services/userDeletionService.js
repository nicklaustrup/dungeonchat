/**
 * User Deletion Service
 * 
 * Provides functionality for users to delete their accounts
 * and all associated data.
 */

import { httpsCallable } from 'firebase/functions';
import { signOut } from 'firebase/auth';

// React import for the hook
import React from 'react';

/**
 * Deletes the current user's account and all associated data
 * @param {Object} functions - Firebase Functions instance
 * @param {Object} auth - Firebase Auth instance
 * @returns {Promise<Object>} Result of the deletion operation
 */
export async function deleteUserAccount(functions, auth) {
  try {
    // Call the cloud function to delete user data
    const deleteUserFunction = httpsCallable(functions, 'deleteUser');
    const result = await deleteUserFunction();

    console.log('User deletion successful:', result.data);

    // Sign out the user (will fail since account is deleted, but attempt anyway)
    try {
      await signOut(auth);
    } catch (signOutError) {
      // Expected to fail since user is deleted
      console.log('Sign out after deletion (expected):', signOutError.message);
    }

    return {
      success: true,
      message: result.data.message,
      details: result.data.details,
    };
  } catch (error) {
    console.error('Error deleting user account:', error);
    
    // Handle specific error codes
    if (error.code === 'unauthenticated') {
      throw new Error('You must be signed in to delete your account.');
    } else if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to perform this action.');
    } else {
      throw new Error(`Failed to delete account: ${error.message}`);
    }
  }
}

/**
 * Confirms user wants to delete their account with a confirmation dialog
 * @param {string} username - User's username to confirm
 * @returns {Promise<boolean>} True if user confirms deletion
 */
export async function confirmAccountDeletion(username) {
  const confirmed = window.confirm(
    `⚠️ WARNING: This action cannot be undone!\n\n` +
    `You are about to permanently delete your account "${username}" and ALL associated data including:\n\n` +
    `• Your profile and settings\n` +
    `• All campaigns you own (will be deleted)\n` +
    `• Your membership in other campaigns\n` +
    `• All your character sheets\n` +
    `• Your messages (will be anonymized)\n` +
    `• All tokens and game data\n\n` +
    `Type your username "${username}" in the next prompt to confirm.`
  );

  if (!confirmed) {
    return false;
  }

  // Double confirmation with username
  const usernameConfirm = window.prompt(
    `Please type your username "${username}" to confirm account deletion:`
  );

  if (usernameConfirm !== username) {
    alert('Username did not match. Account deletion cancelled.');
    return false;
  }

  return true;
}

/**
 * Hook for managing user deletion
 * @param {Object} functions - Firebase Functions instance
 * @param {Object} auth - Firebase Auth instance
 * @param {Object} profile - User profile data
 * @returns {Object} Object containing deleteAccount function and loading state
 */
export function useUserDeletion(functions, auth, profile) {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [error, setError] = React.useState(null);

  const deleteAccount = async () => {
    if (!profile?.username) {
      setError('Unable to load user profile');
      return { success: false, error: 'Unable to load user profile' };
    }

    setIsDeleting(true);
    setError(null);

    try {
      // Show confirmation dialog
      const confirmed = await confirmAccountDeletion(profile.username);
      
      if (!confirmed) {
        setIsDeleting(false);
        return { success: false, cancelled: true };
      }

      // Proceed with deletion
      const result = await deleteUserAccount(functions, auth);
      
      return { success: true, ...result };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteAccount,
    isDeleting,
    error,
  };
}
