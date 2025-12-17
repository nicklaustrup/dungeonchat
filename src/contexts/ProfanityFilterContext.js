import React, { createContext, useContext } from "react";
import { useCachedUserProfile } from "../services/cache";

/**
 * Context for managing profanity filter state across the application
 * Provides centralized access to profanity filter preferences and ensures
 * components re-render when the preference changes
 */
const ProfanityFilterContext = createContext(null);

export function ProfanityFilterProvider({ children }) {
  const { profanityFilterEnabled, toggleProfanityFilter, loading } =
    useCachedUserProfile();

  const value = {
    profanityFilterEnabled,
    toggleProfanityFilter,
    loading,
  };

  return (
    <ProfanityFilterContext.Provider value={value}>
      {children}
    </ProfanityFilterContext.Provider>
  );
}

/**
 * Hook to access profanity filter context
 * @returns {object} - Object with filter state and toggle function
 */
export function useProfanityFilterContext() {
  const context = useContext(ProfanityFilterContext);
  if (!context) {
    throw new Error(
      "useProfanityFilterContext must be used within a ProfanityFilterProvider"
    );
  }
  return context;
}

export default ProfanityFilterContext;
