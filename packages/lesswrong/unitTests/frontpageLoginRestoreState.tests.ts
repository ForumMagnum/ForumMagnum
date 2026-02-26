type TestSessionStorage = {
  clear: () => void,
  getItem: (key: string) => string | null,
  removeItem: (key: string) => void,
  setItem: (key: string, value: string) => void,
};

const createSessionStorage = (): TestSessionStorage => {
  const valuesByKey = new Map<string, string>();
  return {
    clear: () => valuesByKey.clear(),
    getItem: (key: string) => valuesByKey.get(key) ?? null,
    removeItem: (key: string) => {
      valuesByKey.delete(key);
    },
    setItem: (key: string, value: string) => {
      valuesByKey.set(key, value);
    },
  };
}

const loadFrontpageLoginRestoreState = () => {
  const sessionStorage = createSessionStorage();
  (globalThis as AnyBecauseTodo).window = {
    sessionStorage,
  };
  jest.resetModules();
  const {
    consumePendingFrontpageLoginRestoreState,
    markFrontpageLoginRestorePending,
    saveFrontpageLoginRestoreState,
  } = require("@/lib/frontpageLoginRestoreState");

  return {
    consumePendingFrontpageLoginRestoreState,
    markFrontpageLoginRestorePending,
    saveFrontpageLoginRestoreState,
  };
}

describe("frontpageLoginRestoreState", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  afterEach(() => {
    delete (globalThis as AnyBecauseTodo).window;
  });

  it("restores saved state when pending", () => {
    const {
      consumePendingFrontpageLoginRestoreState,
      markFrontpageLoginRestorePending,
      saveFrontpageLoginRestoreState,
    } = loadFrontpageLoginRestoreState();
    jest.spyOn(Date, "now").mockReturnValue(1000);
    saveFrontpageLoginRestoreState({
      selectedTab: "forum-classic",
      expandedPostIds: ["post-1", "post-1", "post-2"],
    });
    markFrontpageLoginRestorePending();

    jest.spyOn(Date, "now").mockReturnValue(2000);
    expect(consumePendingFrontpageLoginRestoreState()).toEqual({
      selectedTab: "forum-classic",
      expandedPostIds: ["post-1", "post-2"],
      updatedAt: 1000,
    });
    expect(consumePendingFrontpageLoginRestoreState()).toBeNull();
  });

  it("does not restore state when pending marker is missing", () => {
    const {
      consumePendingFrontpageLoginRestoreState,
      saveFrontpageLoginRestoreState,
    } = loadFrontpageLoginRestoreState();
    saveFrontpageLoginRestoreState({
      selectedTab: "forum-classic",
      expandedPostIds: ["post-1"],
    });

    expect(consumePendingFrontpageLoginRestoreState()).toBeNull();
  });

  it("drops stale restore state", () => {
    const {
      consumePendingFrontpageLoginRestoreState,
      markFrontpageLoginRestorePending,
      saveFrontpageLoginRestoreState,
    } = loadFrontpageLoginRestoreState();
    jest.spyOn(Date, "now").mockReturnValue(1000);
    saveFrontpageLoginRestoreState({
      selectedTab: "forum-classic",
      expandedPostIds: ["post-1"],
    });
    markFrontpageLoginRestorePending();

    jest.spyOn(Date, "now").mockReturnValue(1000 + (1000 * 60 * 60) + 1);
    expect(consumePendingFrontpageLoginRestoreState()).toBeNull();
  });
});
