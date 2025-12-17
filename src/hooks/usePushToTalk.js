/**
 * usePushToTalk Hook
 * Manages push-to-talk functionality for voice chat
 * Allows users to toggle between always-on and PTT modes
 * In PTT mode, spacebar must be held to transmit audio
 */

import { useState, useEffect, useCallback, useRef } from "react";

export function usePushToTalk(options = {}) {
  const {
    enabled = false,
    key = " ", // Spacebar by default
    onPTTChange = null,
    onModeChange = null,
  } = options;

  const [isPTTEnabled, setIsPTTEnabled] = useState(enabled);
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isPTTActive, setIsPTTActive] = useState(false); // Is key being held?

  const keyDownRef = useRef(false);
  const ignoreChatInputRef = useRef(false);

  /**
   * Check if an element is a text input where we should ignore PTT
   */
  const isTextInput = useCallback((element) => {
    if (!element) return false;

    const tagName = element.tagName?.toLowerCase();
    const type = element.type?.toLowerCase();
    const isEditable = element.isContentEditable;

    // Check if it's an input field
    if (
      tagName === "input" &&
      ["text", "search", "tel", "url", "email", "password"].includes(type)
    ) {
      return true;
    }

    // Check if it's a textarea
    if (tagName === "textarea") {
      return true;
    }

    // Check if it's contentEditable
    if (isEditable) {
      return true;
    }

    return false;
  }, []);

  /**
   * Handle keydown event
   */
  const handleKeyDown = useCallback(
    (event) => {
      // Ignore if PTT is not enabled
      if (!isPTTEnabled) return;

      // Ignore if wrong key
      if (event.key !== key) return;

      // Ignore if already pressed (key repeat)
      if (keyDownRef.current) return;

      // Ignore if typing in a text input
      if (isTextInput(event.target)) {
        ignoreChatInputRef.current = true;
        return;
      }

      // Prevent default to avoid spacebar scrolling the page
      event.preventDefault();

      keyDownRef.current = true;
      setIsPTTActive(true);

      // Notify parent
      if (onPTTChange) {
        onPTTChange(true);
      }
    },
    [isPTTEnabled, key, isTextInput, onPTTChange]
  );

  /**
   * Handle keyup event
   */
  const handleKeyUp = useCallback(
    (event) => {
      // Ignore if PTT is not enabled
      if (!isPTTEnabled) return;

      // Ignore if wrong key
      if (event.key !== key) return;

      // If we ignored this key sequence, reset the flag
      if (ignoreChatInputRef.current) {
        ignoreChatInputRef.current = false;
        return;
      }

      // Prevent default
      event.preventDefault();

      keyDownRef.current = false;
      setIsPTTActive(false);

      // Notify parent
      if (onPTTChange) {
        onPTTChange(false);
      }
    },
    [isPTTEnabled, key, onPTTChange]
  );

  /**
   * Toggle PTT mode on/off
   */
  const togglePTT = useCallback(() => {
    const newValue = !isPTTEnabled;
    setIsPTTEnabled(newValue);

    // If disabling PTT, reset active state
    if (!newValue) {
      setIsPTTActive(false);
      keyDownRef.current = false;
    }

    // Notify parent
    if (onModeChange) {
      onModeChange(newValue);
    }

    // Store preference in localStorage
    try {
      localStorage.setItem("voiceChat_pttEnabled", JSON.stringify(newValue));
    } catch (error) {
      console.error("[usePushToTalk] Failed to save PTT preference:", error);
    }
  }, [isPTTEnabled, onModeChange]);

  /**
   * Set PTT mode explicitly
   */
  const setPTTEnabled = useCallback(
    (enabled) => {
      setIsPTTEnabled(enabled);

      // If disabling PTT, reset active state
      if (!enabled) {
        setIsPTTActive(false);
        keyDownRef.current = false;
      }

      // Notify parent
      if (onModeChange) {
        onModeChange(enabled);
      }

      // Store preference in localStorage
      try {
        localStorage.setItem("voiceChat_pttEnabled", JSON.stringify(enabled));
      } catch (error) {
        console.error("[usePushToTalk] Failed to save PTT preference:", error);
      }
    },
    [onModeChange]
  );

  /**
   * Determine if audio should be transmitted
   * In PTT mode: only when key is held
   * In always-on mode: always true
   */
  useEffect(() => {
    if (isPTTEnabled) {
      // PTT mode: transmit only when key is held
      setIsTransmitting(isPTTActive);
    } else {
      // Always-on mode: always transmit
      setIsTransmitting(true);
    }
  }, [isPTTEnabled, isPTTActive]);

  /**
   * Load PTT preference from localStorage on mount
   */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("voiceChat_pttEnabled");
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        setIsPTTEnabled(parsed);
      }
    } catch (error) {
      console.error("[usePushToTalk] Failed to load PTT preference:", error);
    }
  }, []);

  /**
   * Set up keyboard event listeners
   */
  useEffect(() => {
    if (!isPTTEnabled) return;

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [isPTTEnabled, handleKeyDown, handleKeyUp]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      keyDownRef.current = false;
      setIsPTTActive(false);
    };
  }, []);

  return {
    isPTTEnabled,
    isPTTActive,
    isTransmitting,
    togglePTT,
    setPTTEnabled,
  };
}
