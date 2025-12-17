import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { useFirebase } from "../services/FirebaseContext";
import {
  uploadProfilePicture,
  deleteProfilePicture,
} from "../utils/profilePictureUtils";

/**
 * Hook for managing enhanced user profile data in Firestore
 * Handles custom usernames, profile pictures, bio, and other profile settings
 */
export function useUserProfile() {
  const { firestore, user, functions, storage } = useFirebase();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load user profile on mount or user change
  useEffect(() => {
    if (!user?.uid || !firestore) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const loadProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        const profileRef = doc(firestore, "userProfiles", user.uid);
        const profileSnap = await getDoc(profileRef);

        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        } else {
          // Create enhanced default profile for new users
          const authProvider = user.providerData?.[0]?.providerId || "unknown";

          const newProfile = {
            uid: user.uid,
            // Core identity
            username: "", // Will be set during onboarding
            displayName: user.displayName || "",
            email: user.email || "",

            // Profile content
            bio: "",
            statusMessage: "",
            profilePictureURL: user.photoURL || "",

            // Authentication info
            authProvider: authProvider,
            emailVerified: user.emailVerified || false,

            // Privacy settings
            profileVisibility: "public",
            showEmail: false,
            showLastActive: true,

            // Legacy settings (maintain compatibility)
            profanityFilterEnabled: true,

            // Timestamps
            createdAt: new Date(),
            lastUpdated: new Date(),
          };

          await setDoc(profileRef, newProfile);
          setProfile(newProfile);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
        setError(err);
        // Fallback to minimal profile if there's an error
        setProfile({
          uid: user.uid,
          username: "",
          displayName: user.displayName || "",
          email: user.email || "",
          bio: "",
          statusMessage: "",
          profilePictureURL: user.photoURL || "",
          authProvider: user.providerData?.[0]?.providerId || "unknown",
          emailVerified: user.emailVerified || false,
          profileVisibility: "public",
          showEmail: false,
          showLastActive: true,
          profanityFilterEnabled: true,
          createdAt: new Date(),
          lastUpdated: new Date(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [
    user?.uid,
    firestore,
    user?.displayName,
    user?.email,
    user?.emailVerified,
    user?.photoURL,
    user?.providerData,
  ]);

  // Check username availability
  const checkUsernameAvailability = async (username) => {
    if (!username || !user?.uid) {
      return { available: false, error: "Username is required" };
    }

    // Validate username format first
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return {
        available: false,
        error:
          "Username must be 3-30 characters, letters, numbers, and underscores only",
      };
    }

    try {
      // Use Firebase Functions for server-side validation
      if (functions) {
        const checkUsername = httpsCallable(
          functions,
          "checkUsernameAvailability"
        );
        const result = await checkUsername({ username });

        return {
          available: result.data.available,
          error: result.data.error,
        };
      } else {
        // Fallback if Functions are not available (development mode)
        console.warn(
          "Firebase Functions not available, using client-side validation only"
        );
        return { available: true, error: null };
      }
    } catch (err) {
      console.error("Error checking username availability:", err);

      // Fallback to basic validation if Functions fail
      return {
        available: true,
        error: "Could not verify availability, but format is valid",
      };
    }
  };

  // Upload profile picture
  const uploadProfilePictureFile = async (file) => {
    if (!user?.uid || !storage) {
      throw new Error("User not authenticated or storage not available");
    }

    try {
      // Delete old profile picture if it exists
      if (profile?.profilePictureURL) {
        await deleteProfilePicture(profile.profilePictureURL, storage);
      }

      // Upload new profile picture
      const downloadURL = await uploadProfilePicture(file, user.uid, storage);

      // Update profile with new picture URL
      await updateProfile({ profilePictureURL: downloadURL });

      return downloadURL;
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw error;
    }
  };

  // Update profile data
  const updateProfile = async (updates) => {
    if (!user?.uid || !firestore) {
      throw new Error("User not authenticated");
    }

    try {
      const profileRef = doc(firestore, "userProfiles", user.uid);

      // Handle username changes
      if (
        updates.username !== undefined &&
        updates.username !== profile?.username
      ) {
        const availability = await checkUsernameAvailability(updates.username);
        if (!availability.available) {
          throw new Error(availability.error);
        }

        // Create/update username index
        if (updates.username) {
          const usernameRef = doc(
            firestore,
            "usernames",
            updates.username.toLowerCase()
          );
          await setDoc(usernameRef, {
            uid: user.uid,
            username: updates.username,
            createdAt: new Date(),
          });
        }

        // Clean up old username index if it exists
        if (profile?.username) {
          const oldUsernameRef = doc(
            firestore,
            "usernames",
            profile.username.toLowerCase()
          );
          try {
            await setDoc(oldUsernameRef, { deleted: true }); // Soft delete
          } catch (err) {
            console.warn("Could not clean up old username:", err);
          }
        }
      }

      const updatedData = {
        ...updates,
        lastUpdated: new Date(),
      };

      // Use setDoc with merge to handle both create and update cases
      await setDoc(profileRef, updatedData, { merge: true });

      // Update local state
      setProfile((prev) => ({ ...prev, ...updatedData }));

      return true;
    } catch (err) {
      console.error("Error updating user profile:", err);
      setError(err);
      throw err;
    }
  };

  // Convenience method to toggle profanity filter (legacy)
  const toggleProfanityFilter = async () => {
    if (!profile) return false;

    const newValue = !profile.profanityFilterEnabled;
    await updateProfile({ profanityFilterEnabled: newValue });
    return newValue;
  };

  // Update profile picture
  const updateProfilePicture = async (imageUrl) => {
    await updateProfile({ profilePictureURL: imageUrl });
  };

  // Update privacy settings
  const updatePrivacySettings = async (settings) => {
    const allowedSettings = [
      "profileVisibility",
      "showEmail",
      "showLastActive",
    ];
    const filteredSettings = Object.keys(settings)
      .filter((key) => allowedSettings.includes(key))
      .reduce((obj, key) => {
        obj[key] = settings[key];
        return obj;
      }, {});

    await updateProfile(filteredSettings);
  };

  // Get display info for current user
  const getDisplayInfo = () => {
    if (!profile) return null;

    return {
      displayName: profile.username || profile.displayName || "Anonymous",
      username: profile.username,
      originalDisplayName: profile.displayName,
      profilePicture: profile.profilePictureURL,
      bio: profile.bio,
      statusMessage: profile.statusMessage,
      isComplete: !!(profile.username && profile.username.trim()),
    };
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    checkUsernameAvailability,
    toggleProfanityFilter,
    updateProfilePicture,
    updatePrivacySettings,
    getDisplayInfo,
    // Profile picture management
    uploadProfilePictureFile,

    // Convenience accessors
    profanityFilterEnabled: profile?.profanityFilterEnabled ?? true,
    isProfileComplete: !!(profile?.username && profile?.username.trim()),
    needsOnboarding: !profile?.username || !profile?.username.trim(),
  };
}

export default useUserProfile;
