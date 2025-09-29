/**
 * Client-side profanity filtering utility
 * Handles user preference-based content filtering for display purposes only
 */

import React from 'react';

// Simple profanity word list - in production you might want a more comprehensive list
const PROFANITY_WORDS = [
  'fuck', 'fucking', 'fucked', 'fucker', 'fucks',
  'shit', 'shitting', 'shitted', 'shits',
  'damn', 'damned', 'dammit',
  'bitch', 'bitches', 'bitching',
  'ass', 'asses', 'asshole', 'assholes',
  'bastard', 'bastards',
  'hell', 'hells',
  'crap', 'crappy', 'craps',
  'piss', 'pissed', 'pissing',
  'cock', 'cocks', 'dick', 'dicks',
  'pussy', 'pussies'
];

/**
 * Checks if text contains profanity
 * @param {string} text - Text to check
 * @returns {boolean} - True if profanity detected
 */
export function containsProfanity(text) {
  if (!text || typeof text !== 'string') return false;
  
  const lowerText = text.toLowerCase();
  return PROFANITY_WORDS.some(word => {
    // Use word boundaries to avoid false positives
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Filters profanity from text by replacing with asterisks
 * Shows first letter + asterisks (e.g., "f***" instead of "fuck")
 * @param {string} text - Text to filter
 * @returns {string} - Filtered text
 */
export function filterProfanity(text) {
  if (!text || typeof text !== 'string') return text;
  
  let filteredText = text;
  
  PROFANITY_WORDS.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    filteredText = filteredText.replace(regex, (match) => {
      // Keep first letter, replace rest with asterisks
      return match[0] + '*'.repeat(Math.max(1, match.length - 1));
    });
  });
  
  return filteredText;
}

/**
 * Hook for profanity filtering based on user preference
 * @param {string} text - Original text
 * @param {boolean} filterEnabled - User's profanity filter preference
 * @returns {string} - Filtered or original text based on preference
 */
export function useProfanityFilter(text, filterEnabled) {
  if (!filterEnabled) {
    return text; // Return original text if filter is disabled
  }
  
  return filterProfanity(text);
}

/**
 * React hook that provides profanity filtering functionality
 * @param {boolean} filterEnabled - User's profanity filter setting
 * @returns {object} - Object with filter function and utilities
 */
export function useProfanityFiltering(filterEnabled = true) {
  const filterText = React.useCallback((text) => {
    if (!filterEnabled) {
      return text; // Return original text if filter is disabled
    }
    return filterProfanity(text);
  }, [filterEnabled]);
  
  return {
    filterText,
    containsProfanity,
    isFilterEnabled: filterEnabled
  };
}

const profanityFilterUtils = {
  containsProfanity,
  filterProfanity,
  useProfanityFilter,
  useProfanityFiltering
};

export default profanityFilterUtils;