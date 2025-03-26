import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserLocalStorage } from '../components/editor/localStorageHandlers';
import { isClient } from './executionEnvironment';

// Define the comment title style options
export type CommentTitleStyle = 
  | "postStyleHeading" 
  | "commentReplyStyleBeneathMetaInfo" 
  | "commentReplyStyleAboveMetaInfo";

// Define the settings interface
export interface UltraFeedSettings {
  commentTitleStyle: CommentTitleStyle;
  postTruncationBreakpoints: number[];
  commentTruncationBreakpoints: number[];
  collapsedCommentTruncation: number;
  showVerticalLine: boolean;
  lineClampNumberOfLines: number;
}

// Default settings
export const DEFAULT_SETTINGS: UltraFeedSettings = {
  commentTitleStyle: "commentReplyStyleBeneathMetaInfo",
  postTruncationBreakpoints: [100, 500, 1000],
  commentTruncationBreakpoints: [50, 300, 600],
  collapsedCommentTruncation: 50,
  showVerticalLine: false,
  lineClampNumberOfLines: 0,
};

// Storage key
const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings';

// Event name for settings change
export const SETTINGS_CHANGE_EVENT = 'ultraFeedSettingsChanged';

// Function to get settings from localStorage (for direct access outside the hook)
export const getUltraFeedSettings = (): UltraFeedSettings => {
  if (!isClient) return DEFAULT_SETTINGS;
  
  const ls = getBrowserLocalStorage();
  if (!ls) return DEFAULT_SETTINGS;
  
  const storedSettings = ls.getItem(ULTRA_FEED_SETTINGS_KEY);
  if (!storedSettings) return DEFAULT_SETTINGS;
  
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
  } catch (e) {
    // If parsing fails, return defaults
    console.error("Failed to parse UltraFeed settings", e);
    return DEFAULT_SETTINGS;
  }
};

// Function to save settings to localStorage (for direct access outside the hook)
export const saveUltraFeedSettings = (settings: Partial<UltraFeedSettings>): void => {
  if (!isClient) return;
  
  const ls = getBrowserLocalStorage();
  if (!ls) return;
  
  const currentSettings = getUltraFeedSettings();
  const newSettings = { ...currentSettings, ...settings };
  
  ls.setItem(ULTRA_FEED_SETTINGS_KEY, JSON.stringify(newSettings));
  
  // Dispatch event to notify listeners
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: newSettings }));
};

/**
 * Hook to access and update UltraFeed settings
 * Settings are stored in localStorage
 */
export const useUltraFeedSettings = () => {
  // State to hold settings
  const [settings, setSettings] = useState<UltraFeedSettings>(getUltraFeedSettings);
  
  // Helper to save settings to localStorage
  const saveSettings = useCallback((newSettings: Partial<UltraFeedSettings>) => {
    saveUltraFeedSettings(newSettings);
  }, []);
  
  // Function to update a single setting
  const updateSetting = useCallback(<K extends keyof UltraFeedSettings>(
    key: K, 
    value: UltraFeedSettings[K]
  ) => {
    saveSettings({ [key]: value } as Partial<UltraFeedSettings>);
  }, [saveSettings]);
  
  // Function to reset settings to defaults
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);
  
  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      setSettings(getUltraFeedSettings());
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, []);
  
  return {
    settings,
    updateSetting,
    resetSettings
  };
}; 