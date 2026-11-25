import { sleep } from "@/lib/utils/asyncUtils";
import { isPostgresUniqueViolation } from "@/server/utils/postgresErrors";

/**
 * Narration's caches (scripts, and the audio for their segments) are filled in
 * on demand, by work that takes seconds and costs money. Several listeners can
 * ask for the same thing at once, so a cache entry is claimed before the work
 * on it starts: its row is inserted unfinished, and the unique index on its
 * key lets only one request do that. That request does the work and finishes
 * the entry. The others wait for the entry to be finished, and get it too.
 *
 * A request can die without finishing or giving up its claim. So an entry
 * that has been unfinished for too long is taken to be abandoned, and whoever
 * notices deletes it and starts again.
 */

const POLL_INTERVAL_MS = 500;

interface ClaimableEntry {
  /** When the entry was claimed */
  createdAt: Date
}

/** How one kind of cache entry is found and made, given its key */
export interface ClaimedGeneration<Key, Entry extends ClaimableEntry, FinishedEntry extends Entry> {
  findEntry: (key: Key) => Promise<Entry|null>
  isFinished: (entry: Entry) => entry is FinishedEntry
  /**
   * Inserts an unfinished entry. This has to fail with a unique violation if
   * the key already has an entry. That's an ordinary thing to happen, so the
   * insert should be a quiet one, which doesn't log its failure as an error.
   */
  claimEntry: (key: Key) => Promise<Entry>
  /**
   * Does the work, and stores its results in the entry. Returns null if the
   * entry has gone, which means that the work took so long that another
   * request took it to be abandoned.
   */
  finishEntry: (claimedEntry: Entry, key: Key) => Promise<FinishedEntry|null>
  /** Deletes an entry, unless it has been finished in the meantime */
  abandonEntry: (entry: Entry) => Promise<void>
  /** How long an entry can stay unfinished before it's taken to be abandoned */
  abandonedAfterMs: number
}

async function claimUnlessTaken<Key, Entry extends ClaimableEntry, FinishedEntry extends Entry>(
  generation: ClaimedGeneration<Key, Entry, FinishedEntry>,
  key: Key,
): Promise<Entry|null> {
  try {
    return await generation.claimEntry(key);
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      return null;
    }
    throw error;
  }
}

/** Returns null if another request claimed the entry first, or took it over */
async function claimAndFinish<Key, Entry extends ClaimableEntry, FinishedEntry extends Entry>(
  generation: ClaimedGeneration<Key, Entry, FinishedEntry>,
  key: Key,
): Promise<FinishedEntry|null> {
  const claimedEntry = await claimUnlessTaken(generation, key);
  if (!claimedEntry) {
    return null;
  }
  try {
    return await generation.finishEntry(claimedEntry, key);
  } catch (error) {
    // Give up the claim, so that the requests waiting on it don't have to wait
    // for it to look abandoned
    await generation.abandonEntry(claimedEntry);
    throw error;
  }
}

/**
 * Gets the cache entry for a key, generating it if nothing has. If another
 * request is generating it, waits for that request's result instead.
 */
export async function getOrGenerate<Key, Entry extends ClaimableEntry, FinishedEntry extends Entry>(
  generation: ClaimedGeneration<Key, Entry, FinishedEntry>,
  key: Key,
): Promise<FinishedEntry> {
  for (;;) {
    const existingEntry = await generation.findEntry(key);
    if (existingEntry && generation.isFinished(existingEntry)) {
      return existingEntry;
    }
    if (!existingEntry) {
      const finishedEntry = await claimAndFinish(generation, key);
      if (finishedEntry) {
        return finishedEntry;
      }
    } else if (Date.now() - existingEntry.createdAt.getTime() > generation.abandonedAfterMs) {
      await generation.abandonEntry(existingEntry);
      continue;
    }
    await sleep(POLL_INTERVAL_MS);
  }
}
