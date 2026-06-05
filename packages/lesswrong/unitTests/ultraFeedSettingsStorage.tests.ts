import { readStoredSettings, writeStoredSettings } from "../components/hooks/useUltraFeedSettings";
import { getDefaultSettingsForDevice, ULTRA_FEED_SETTINGS_KEY } from "../components/ultraFeed/ultraFeedSettingsTypes";

const originalLocalStorageDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");

function restoreLocalStorage() {
  if (originalLocalStorageDescriptor) {
    Object.defineProperty(globalThis, "localStorage", originalLocalStorageDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, "localStorage");
  }
}

describe("UltraFeed settings localStorage helpers", () => {
  afterEach(() => {
    restoreLocalStorage();
  });

  it("returns null when reading localStorage throws", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    });

    expect(readStoredSettings(getDefaultSettingsForDevice("desktop"))).toBeNull();
  });

  it("returns false when writing localStorage throws", () => {
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        setItem: () => {
          throw new Error("QuotaExceededError");
        },
      },
    });

    expect(writeStoredSettings(getDefaultSettingsForDevice("desktop"))).toBe(false);
  });

  it("reads and writes settings when localStorage is available", () => {
    const storedValues = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => storedValues.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storedValues.set(key, value);
        },
      },
    });

    const settings = getDefaultSettingsForDevice("desktop");
    expect(writeStoredSettings(settings)).toBe(true);
    expect(storedValues.has(ULTRA_FEED_SETTINGS_KEY)).toBe(true);
    expect(readStoredSettings(settings)).toEqual(settings);
  });
});
