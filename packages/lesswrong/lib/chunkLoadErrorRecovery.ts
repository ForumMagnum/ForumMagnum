const CHUNK_LOAD_RETRY_STORAGE_KEY = "forumMagnumChunkLoadRetry";

export const CHUNK_LOAD_RETRY_COOLDOWN_MS = 60_000;

const chunkLoadErrorPatterns = [
  /ChunkLoadError/i,
  /Loading chunk [\w-]+ failed/i,
  /Failed to load chunk/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /error loading dynamically imported module/i,
];

export function isChunkLoadError(error: Error): boolean {
  const description = `${error.name}: ${error.message}`;
  return chunkLoadErrorPatterns.some((pattern) => pattern.test(description));
}

export function shouldReloadAfterChunkLoadError(
  error: Error,
  storage: Pick<Storage, "getItem" | "setItem">,
  now = Date.now(),
): boolean {
  if (!isChunkLoadError(error)) {
    return false;
  }

  try {
    const previousRetry = Number(storage.getItem(CHUNK_LOAD_RETRY_STORAGE_KEY));
    if (previousRetry > 0 && now - previousRetry < CHUNK_LOAD_RETRY_COOLDOWN_MS) {
      return false;
    }

    storage.setItem(CHUNK_LOAD_RETRY_STORAGE_KEY, String(now));
    return true;
  } catch {
    // Without storage, a reload could loop indefinitely if the chunk remains
    // unavailable.
    return false;
  }
}
