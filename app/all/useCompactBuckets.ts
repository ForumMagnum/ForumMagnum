"use client";

import { useCallback, useSyncExternalStore } from 'react';

// Module-level state for whether ActivityBucket summaries are collapsed.
// Shared across all buckets so toggling one bucket toggles all of them, without prop-drilling.
let compact = false;
const listeners = new Set<() => void>();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
};

const getSnapshot = () => compact;
const getServerSnapshot = () => false;

const setCompact = (next: boolean) => {
  if (compact === next) return;
  compact = next;
  listeners.forEach(listener => listener());
};

export const useCompactBuckets = () => {
  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const toggle = useCallback(() => setCompact(!compact), []);
  return { compact: value, toggleCompact: toggle };
};
