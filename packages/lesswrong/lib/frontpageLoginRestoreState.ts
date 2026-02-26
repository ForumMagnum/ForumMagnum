import { isClient } from '@/lib/executionEnvironment';

const frontpageLoginRestoreStateKey = "frontpageLoginRestoreState_v1";
const frontpageLoginRestorePendingKey = "frontpageLoginRestorePending_v1";
const maxFrontpageLoginRestoreStateAgeMs = 1000 * 60 * 60;

export interface FrontpageLoginRestoreState {
  selectedTab: string;
  expandedPostIds: string[];
  updatedAt: number;
}

function getSessionStorage() {
  if (!isClient) {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch (e) {
    return null;
  }
}

function parseFrontpageLoginRestoreState(rawValue: string | null): FrontpageLoginRestoreState | null {
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (
      !parsedValue
      || typeof parsedValue !== "object"
      || typeof parsedValue.selectedTab !== "string"
      || !Array.isArray(parsedValue.expandedPostIds)
      || typeof parsedValue.updatedAt !== "number"
    ) {
      return null;
    }

    const expandedPostIds = parsedValue.expandedPostIds.filter((postId: unknown) => typeof postId === "string");
    return {
      selectedTab: parsedValue.selectedTab,
      expandedPostIds,
      updatedAt: parsedValue.updatedAt,
    };
  } catch (e) {
    return null;
  }
}

function getStoredFrontpageLoginRestoreState() {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  return parseFrontpageLoginRestoreState(storage.getItem(frontpageLoginRestoreStateKey));
}

export function saveFrontpageLoginRestoreState({
  selectedTab,
  expandedPostIds,
}: {
  selectedTab: string,
  expandedPostIds: string[],
}) {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  const deduplicatedExpandedPostIds = Array.from(new Set(expandedPostIds));
  const stateToStore: FrontpageLoginRestoreState = {
    selectedTab,
    expandedPostIds: deduplicatedExpandedPostIds,
    updatedAt: Date.now(),
  };
  storage.setItem(frontpageLoginRestoreStateKey, JSON.stringify(stateToStore));
}

export function markFrontpageLoginRestorePending() {
  const storage = getSessionStorage();
  if (!storage) {
    return;
  }

  if (!getStoredFrontpageLoginRestoreState()) {
    return;
  }

  storage.setItem(frontpageLoginRestorePendingKey, "1");
}

export function consumePendingFrontpageLoginRestoreState(): FrontpageLoginRestoreState | null {
  const storage = getSessionStorage();
  if (!storage) {
    return null;
  }

  const isPending = storage.getItem(frontpageLoginRestorePendingKey) === "1";
  storage.removeItem(frontpageLoginRestorePendingKey);
  if (!isPending) {
    return null;
  }

  const storedState = getStoredFrontpageLoginRestoreState();
  if (!storedState) {
    storage.removeItem(frontpageLoginRestoreStateKey);
    return null;
  }

  if ((Date.now() - storedState.updatedAt) > maxFrontpageLoginRestoreStateAgeMs) {
    storage.removeItem(frontpageLoginRestoreStateKey);
    return null;
  }

  storage.removeItem(frontpageLoginRestoreStateKey);
  return storedState;
}
