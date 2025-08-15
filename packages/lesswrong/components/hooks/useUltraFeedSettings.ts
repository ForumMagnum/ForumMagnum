import { useCallback, useMemo, useState } from 'react';
import { getBrowserLocalStorage } from '@/components/editor/localStorageHandlers';
import { isClient } from '@/lib/executionEnvironment';
import { useTracking } from '@/lib/analyticsEvents';
import {
  DeviceKind,
  DEFAULT_SETTINGS,
  getDefaultSettingsForDevice,
  getTruncationMapsForDevice,
  TruncationLevel,
  UltraFeedSettingsType,
  ULTRA_FEED_SETTINGS_KEY,
} from '@/components/ultraFeed/ultraFeedSettingsTypes';
import useDeviceKind from './useDeviceKind';

export interface UseUltraFeedSettingsResult {
  settings: UltraFeedSettingsType;
  updateSettings: (partial: Partial<UltraFeedSettingsType>) => void;
  resetSettings: () => void;
  deviceKind: DeviceKind;
  truncationMaps: { commentMap: Record<TruncationLevel, number>, postMap: Record<TruncationLevel, number> };
}

const readStoredSettings = (): UltraFeedSettingsType | null => {
  if (!isClient) return null;
  const ls = getBrowserLocalStorage();
  if (!ls) return null;
  const raw = ls.getItem(ULTRA_FEED_SETTINGS_KEY);
  if (!raw) return null;
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } as UltraFeedSettingsType;
  } catch {
    return null;
  }
};

const writeStoredSettings = (next: UltraFeedSettingsType): void => {
  const ls = getBrowserLocalStorage();
  if (!ls) return;
  ls.setItem(ULTRA_FEED_SETTINGS_KEY, JSON.stringify(next));
};

export const useUltraFeedSettings = (): UseUltraFeedSettingsResult => {
  const { captureEvent } = useTracking();
  const deviceKind = useDeviceKind();

  const initialSettings: UltraFeedSettingsType = useMemo(() => {
    const stored = readStoredSettings();
    if (stored) return stored;
    return getDefaultSettingsForDevice(deviceKind);
  }, [deviceKind]);

  const [settings, setSettings] = useState<UltraFeedSettingsType>(initialSettings);

  const updateSettings = useCallback((partial: Partial<UltraFeedSettingsType>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial } as UltraFeedSettingsType;
      writeStoredSettings(next);
      captureEvent('ultraFeedSettingsUpdated', { changedSettings: Object.keys(partial), deviceKind, next });
      return next;
    });
  }, [captureEvent]);

  const resetSettings = useCallback(() => {
    const defaultSettings = getDefaultSettingsForDevice(deviceKind);
    setSettings(defaultSettings);
    writeStoredSettings(defaultSettings);
    captureEvent('ultraFeedSettingsReset', { deviceKind, defaultSettings });
  }, [deviceKind, captureEvent]);

  const truncationMaps = useMemo(() => getTruncationMapsForDevice(deviceKind), [deviceKind]);

  return { settings, updateSettings, resetSettings, deviceKind, truncationMaps };
};

export default useUltraFeedSettings;


