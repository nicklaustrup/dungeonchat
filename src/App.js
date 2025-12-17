import React, { useState } from "react";
import "./App.css";
import "./responsive.css"; // Phase 1 mobile responsiveness
import { PresenceProvider } from "./services/PresenceContext";
import { EmojiMenuProvider } from "./components/ChatInput/EmojiMenu";
import { ChatStateProvider } from "./contexts/ChatStateContext";
import { CampaignProvider } from "./contexts/CampaignContext";
import { ProfanityFilterProvider } from "./contexts/ProfanityFilterContext";
import AppRouter from "./components/AppRouter";
import { ProfileSetupModal } from "./components/ProfileSetupModal/ProfileSetupModal";
import { useViewportInfo } from "./hooks/useViewportInfo";
import { useVirtualKeyboard } from "./hooks/useVirtualKeyboard";
import { useInitTelemetry } from "./hooks/useInitTelemetry";
import {
  useCachedUserProfile,
  firestoreCache,
  logCacheStats,
  getCacheStats,
} from "./services/cache";
import { useFirebase } from "./services/FirebaseContext";

// Expose cache utilities globally for debugging
if (typeof window !== "undefined") {
  window.firestoreCache = firestoreCache;
  window.logCacheStats = logCacheStats;
  window.getCacheStats = getCacheStats;
}

function App() {
  // Apply viewport class logic once at app root
  useViewportInfo();
  // Detect virtual keyboard & toggle html.keyboard-open
  useVirtualKeyboard();
  // Initialize Phase 5 environment & interaction telemetry
  useInitTelemetry();

  const { user } = useFirebase();
  const {
    needsOnboarding,
    isProfileComplete,
    loading: profileLoading,
  } = useCachedUserProfile();
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [forceProfileSetup, setForceProfileSetup] = useState(false);

  // Show profile setup for authenticated users who need onboarding
  // Wait for profile to load to prevent flash
  React.useEffect(() => {
    // Don't show modal until profile data is loaded
    if (profileLoading) {
      setShowProfileSetup(false);
      return;
    }

    if (
      user &&
      ((needsOnboarding && !isProfileComplete) || forceProfileSetup)
    ) {
      setShowProfileSetup(true);
    } else {
      setShowProfileSetup(false);
    }
  }, [
    user,
    needsOnboarding,
    isProfileComplete,
    forceProfileSetup,
    profileLoading,
  ]);

  // Initialize away seconds from localStorage (moved to ChatStateProvider)
  const [awayAfterSeconds] = React.useState(() => {
    const stored = localStorage.getItem("awayAfterSeconds");
    const val = stored ? parseInt(stored, 10) : 300;
    return isNaN(val) ? 300 : val;
  });

  const handleProfileSetupComplete = () => {
    setShowProfileSetup(false);
    setForceProfileSetup(false);
  };

  // Removed unused handleForceProfileSetup function

  return (
    <ChatStateProvider initialAwaySeconds={awayAfterSeconds}>
      <PresenceProvider awayAfterSeconds={awayAfterSeconds}>
        <ProfanityFilterProvider>
          <CampaignProvider>
            <AppRouter />
            <EmojiMenuProvider />

            {/* Profile Setup Modal for new users */}
            {showProfileSetup && (
              <ProfileSetupModal
                onComplete={handleProfileSetupComplete}
                canSkip={!forceProfileSetup}
              />
            )}
          </CampaignProvider>
        </ProfanityFilterProvider>
      </PresenceProvider>
    </ChatStateProvider>
  );
}

export default App;
