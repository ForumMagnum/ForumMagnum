import { useCallback, useEffect, useState } from 'react';
import { getUltraFeedSettings, saveUltraFeedSettings, DEFAULT_SETTINGS, SETTINGS_CHANGE_EVENT, UltraFeedSettings } from '../../lib/ultraFeedSettings';

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
