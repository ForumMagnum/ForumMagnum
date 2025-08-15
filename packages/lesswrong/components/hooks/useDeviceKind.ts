import { useMemo } from 'react';
import { isClient } from '@/lib/executionEnvironment';
import type { DeviceKind } from '@/components/ultraFeed/ultraFeedSettingsTypes';

const SM_BREAKPOINT_PX = 600; // Keep in sync with theme breakpoints

export const useDeviceKind = (): DeviceKind => {
  // Non-reactive: decide once per mount for stability and to avoid flicker
  return useMemo<DeviceKind>(() => {
    if (!isClient) return 'desktop';
    try {
      const mq = window.matchMedia(`(max-width: ${SM_BREAKPOINT_PX}px)`);
      return mq.matches ? 'mobile' : 'desktop';
    } catch {
      return 'desktop';
    }
  }, []);
};

export default useDeviceKind;

