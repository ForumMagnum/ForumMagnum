import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserLocalStorage } from '../components/editor/localStorageHandlers';
import { isClient } from './executionEnvironment';


export interface UltraFeedSettings {
  postTruncationBreakpoints: number[];
  commentTruncationBreakpoints: number[];
  collapsedCommentTruncation: number;
  lineClampNumberOfLines: number;
}

export const DEFAULT_SETTINGS: UltraFeedSettings = {
  postTruncationBreakpoints: [100, 500, 1000],
  commentTruncationBreakpoints: [50, 300, 600],
  collapsedCommentTruncation: 50,
  lineClampNumberOfLines: 2,
};

const ULTRA_FEED_SETTINGS_KEY = 'ultraFeedSettings';
export const SETTINGS_CHANGE_EVENT = 'ultraFeedSettingsChanged';

export const getUltraFeedSettings = (): UltraFeedSettings => {
  if (!isClient) return DEFAULT_SETTINGS;
  
  const ls = getBrowserLocalStorage();
  if (!ls) return DEFAULT_SETTINGS;
  
  const storedSettings = ls.getItem(ULTRA_FEED_SETTINGS_KEY);
  if (!storedSettings) return DEFAULT_SETTINGS;
  
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to parse UltraFeed settings", e);
    return DEFAULT_SETTINGS;
  }
};

export const saveUltraFeedSettings = (settings: Partial<UltraFeedSettings>): void => {
  if (!isClient) return;
  
  const ls = getBrowserLocalStorage();
  if (!ls) return;
  
  const currentSettings = getUltraFeedSettings();
  const newSettings = { ...currentSettings, ...settings };
  
  ls.setItem(ULTRA_FEED_SETTINGS_KEY, JSON.stringify(newSettings));
  
  window.dispatchEvent(new CustomEvent(SETTINGS_CHANGE_EVENT, { detail: newSettings }));
};

/**
 * Hook to access and update UltraFeed settings
 * Settings are stored in localStorage
 */
export const useUltraFeedSettings = () => {
  const [settings, setSettings] = useState<UltraFeedSettings>(getUltraFeedSettings);
  
  const saveSettings = useCallback((newSettings: Partial<UltraFeedSettings>) => {
    saveUltraFeedSettings(newSettings);
  }, []);
  
  const updateSetting = useCallback(<K extends keyof UltraFeedSettings>(
    key: K, 
    value: UltraFeedSettings[K]
  ) => {
    saveSettings({ [key]: value } as Partial<UltraFeedSettings>);
  }, [saveSettings]);
  
  const resetSettings = useCallback(() => {
    saveSettings(DEFAULT_SETTINGS);
  }, [saveSettings]);
  
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
