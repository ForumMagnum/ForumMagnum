import {
  CHUNK_LOAD_RETRY_COOLDOWN_MS,
  isChunkLoadError,
  shouldReloadAfterChunkLoadError,
} from "../lib/chunkLoadErrorRecovery";

function createStorage() {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
  return { storage, values };
}

describe("chunk load error recovery", () => {
  it.each([
    ["ChunkLoadError", "Failed to load chunk /_next/static/chunks/example.js from module 123"],
    ["Error", "Loading chunk 123 failed"],
    ["TypeError", "Failed to fetch dynamically imported module"],
    ["TypeError", "Importing a module script failed"],
    ["TypeError", "error loading dynamically imported module"],
  ])("recognizes %s: %s", (name, message) => {
    const error = new Error(message);
    error.name = name;
    expect(isChunkLoadError(error)).toBe(true);
  });

  it("does not classify unrelated network errors as chunk load errors", () => {
    expect(isChunkLoadError(new Error("Failed to fetch GraphQL response"))).toBe(false);
  });

  it("allows one reload per cooldown period", () => {
    const { storage } = createStorage();
    const error = new Error("Failed to load chunk /_next/static/chunks/example.js");
    const now = 1_000_000;

    expect(shouldReloadAfterChunkLoadError(error, storage, now)).toBe(true);
    expect(shouldReloadAfterChunkLoadError(error, storage, now + 1)).toBe(false);
    expect(shouldReloadAfterChunkLoadError(
      error,
      storage,
      now + CHUNK_LOAD_RETRY_COOLDOWN_MS,
    )).toBe(true);
  });

  it("does not write retry state for unrelated errors", () => {
    const { storage, values } = createStorage();

    expect(shouldReloadAfterChunkLoadError(
      new Error("Missing response for batched operation index 0"),
      storage,
      1_000_000,
    )).toBe(false);
    expect(values.size).toBe(0);
  });

  it("does not reload when session storage is unavailable", () => {
    const storage = {
      getItem: () => {
        throw new Error("SecurityError");
      },
      setItem: () => {
        throw new Error("SecurityError");
      },
    };

    expect(shouldReloadAfterChunkLoadError(
      new Error("ChunkLoadError"),
      storage,
      1_000_000,
    )).toBe(false);
  });
});
