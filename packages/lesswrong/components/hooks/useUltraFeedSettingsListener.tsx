import { useEffect, useState } from 'react';
import { getUltraFeedSettings, SETTINGS_CHANGE_EVENT, UltraFeedSettings } from '../../lib/ultraFeedSettings';

/**
 * Hook that listens for UltraFeed settings changes and forces a re-render
 * when they change. This is useful for components that need to respond to
 * settings changes but don't need to access the settings directly.
 * 
 * @returns A counter that increments when settings change (used to force re-renders)
 */
export const useUltraFeedSettingsListener = () => {
  const [changeCounter, setChangeCounter] = useState(0);
  
  useEffect(() => {
    const handleSettingsChange = () => {
      setChangeCounter(prev => prev + 1);
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, []);
  
  return changeCounter;
};

/**
 * Hook that listens for changes to a specific UltraFeed setting
 * and returns its current value.
 * 
 * @param key The setting key to watch
 * @returns The current value of the setting
 */
export function useUltraFeedSetting<K extends keyof UltraFeedSettings>(key: K): UltraFeedSettings[K] {
  const [value, setValue] = useState(() => getUltraFeedSettings()[key]);
  
  useEffect(() => {
    const handleSettingsChange = (event: Event) => {
      const customEvent = event as CustomEvent<UltraFeedSettings>;
      if (customEvent.detail && customEvent.detail[key] !== undefined) {
        setValue(customEvent.detail[key]);
      } else {
        // If not in event detail, fetch from storage
        setValue(getUltraFeedSettings()[key]);
      }
    };
    
    window.addEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    
    return () => {
      window.removeEventListener(SETTINGS_CHANGE_EVENT, handleSettingsChange);
    };
  }, [key]);
  
  return value;
} 