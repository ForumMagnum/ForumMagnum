import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBrowserLocalStorage, safeStorageGetItem, safeStorageSetItem } from '@/components/editor/localStorageHandlers';
import { useTracking } from '@/lib/analyticsEvents';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from './useUpdateCurrentUser';
import {
  DeviceKind,
  getDefaultSettingsForDevice,
  getTruncationMapsForDevice,
  TruncationLevel,
  UltraFeedSettingsType,
  ULTRA_FEED_SETTINGS_KEY,
} from '@/components/ultraFeed/ultraFeedSettingsTypes';
import { isMobile } from '@/lib/utils/isMobile';
import merge from 'lodash/merge';
import cloneDeep from 'lodash/cloneDeep';

export interface UseUltraFeedSettingsResult {
  settings: UltraFeedSettingsType;
  updateSettings: (partial: Partial<UltraFeedSettingsType>) => void;
  resetSettings: () => void;
  deviceKind: DeviceKind;
  truncationMaps: { commentMap: Record<TruncationLevel, number>, postMap: Record<TruncationLevel, number> };
}

export const readStoredSettings = (deviceDefaultSettings: UltraFeedSettingsType): UltraFeedSettingsType | null => {
  const ls = getBrowserLocalStorage();
  if (!ls) return null;
  try {
    const raw = safeStorageGetItem(ls, ULTRA_FEED_SETTINGS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Deep merge user settings with defaults to handle missing fields
    return merge(
      cloneDeep(deviceDefaultSettings),
      parsed
    ) as UltraFeedSettingsType;
  } catch {
    return null;
  }
};

const mergeWithDefaultsForDevice = (
  deviceDefaultSettings: UltraFeedSettingsType,
  settings: Partial<UltraFeedSettingsType> | null | undefined
): UltraFeedSettingsType | null => {
  if (!settings) return null;
  return merge(
    cloneDeep(deviceDefaultSettings),
    settings
  ) as UltraFeedSettingsType;
};

const getSettingsTimestamp = (settings: Partial<UltraFeedSettingsType> | null | undefined): number => {
  const timestamp = settings?.lastEditedAt ? Date.parse(settings.lastEditedAt) : 0;
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const chooseNewestSettings = (
  localSettings: UltraFeedSettingsType | null,
  userSettings: UltraFeedSettingsType | null,
): UltraFeedSettingsType | null => {
  if (!localSettings) return userSettings;
  if (!userSettings) return localSettings;

  const localTimestamp = getSettingsTimestamp(localSettings);
  const userTimestamp = getSettingsTimestamp(userSettings);
  return localTimestamp >= userTimestamp ? localSettings : userSettings;
};

export const writeStoredSettings = (next: UltraFeedSettingsType): boolean => {
  const ls = getBrowserLocalStorage();
  return safeStorageSetItem(ls, ULTRA_FEED_SETTINGS_KEY, JSON.stringify(next));
};

export const useUltraFeedSettings = (): UseUltraFeedSettingsResult => {
  const { captureEvent } = useTracking();
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const deviceKind = useMemo<DeviceKind>(() => (isMobile() ? 'mobile' : 'desktop'), []);

  // Always start with default settings to ensure SSR/client hydration match
  const defaultSettings = useMemo(() => getDefaultSettingsForDevice(deviceKind), [deviceKind]);
  const [settings, setSettings] = useState<UltraFeedSettingsType>(defaultSettings);

  useEffect(() => {
    const localSettings = readStoredSettings(defaultSettings);
    const userSettings = mergeWithDefaultsForDevice(defaultSettings, currentUser?.ultraFeedSettings);
    const newestSettings = chooseNewestSettings(localSettings, userSettings);
    
    if (newestSettings) {
      setSettings(newestSettings);
      writeStoredSettings(newestSettings);
    }

    if (currentUser && localSettings && getSettingsTimestamp(localSettings) > getSettingsTimestamp(userSettings)) {
      void updateCurrentUser({
        ultraFeedSettings: localSettings,
      });
    }
  }, [currentUser, defaultSettings, updateCurrentUser]);

  const updateSettings = useCallback((partial: Partial<UltraFeedSettingsType>) => {
    setSettings(prev => {
      const next = { ...prev, ...partial, lastEditedAt: new Date().toISOString() } as UltraFeedSettingsType;
      writeStoredSettings(next);
      if (currentUser) {
        void updateCurrentUser({
          ultraFeedSettings: next,
        });
      }
      captureEvent('ultraFeedSettingsUpdated', { changedSettings: Object.keys(partial), deviceKind, next });
      return next;
    });
  }, [captureEvent, currentUser, deviceKind, updateCurrentUser]);

  const resetSettings = useCallback(() => {
    const defaultSettings = {
      ...getDefaultSettingsForDevice(deviceKind),
      lastEditedAt: new Date().toISOString(),
    };
    setSettings(defaultSettings);
    writeStoredSettings(defaultSettings);
    if (currentUser) {
      void updateCurrentUser({
        ultraFeedSettings: defaultSettings,
      });
    }
    captureEvent('ultraFeedSettingsReset', { deviceKind, defaultSettings });
  }, [deviceKind, captureEvent, currentUser, updateCurrentUser]);

  const truncationMaps = useMemo(() => getTruncationMapsForDevice(deviceKind), [deviceKind]);

  return { settings, updateSettings, resetSettings, deviceKind, truncationMaps };
};

export default useUltraFeedSettings;

