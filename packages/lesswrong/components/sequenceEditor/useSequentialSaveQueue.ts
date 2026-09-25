import { useMemo, useState } from "react";
import { useMessages } from "../common/withMessages";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface SaveQueue {
  /**
   * Queue a save. Saves run one at a time in the order they were queued, so
   * quick successive edits can't overwrite each other. If `save` fails,
   * `rollback` is called to undo the optimistic change it was saving.
   */
  enqueue: (save: () => Promise<unknown>, rollback: () => void) => void;
  /** Resolves once every queued save has finished. */
  drain: () => Promise<void>;
}

/**
 * The framework-free core of useSequentialSaveQueue, exported for testing.
 */
export function createSaveQueue({ onStatusChange, onError }: {
  onStatusChange: (status: SaveStatus) => void,
  onError: (error: Error) => void,
}): SaveQueue {
  let tail: Promise<void> = Promise.resolve();
  let pendingCount = 0;
  let lastSaveFailed = false;

  const enqueue = (save: () => Promise<unknown>, rollback: () => void) => {
    pendingCount++;
    if (pendingCount === 1) {
      onStatusChange("saving");
    }
    tail = tail.then(async () => {
      try {
        await save();
        lastSaveFailed = false;
      } catch (e) {
        lastSaveFailed = true;
        rollback();
        onError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        pendingCount--;
        if (pendingCount === 0) {
          onStatusChange(lastSaveFailed ? "error" : "saved");
        }
      }
    });
  };

  return { enqueue, drain: () => tail };
}

/**
 * A queue for changes that save as you go: each one is applied to local state
 * straight away, then saved in order in the background.
 */
export function useSequentialSaveQueue(): SaveQueue & { status: SaveStatus } {
  const { flash } = useMessages();
  const [status, setStatus] = useState<SaveStatus>("idle");
  const queue = useMemo(() => createSaveQueue({
    onStatusChange: setStatus,
    onError: (error) => flash({ messageString: `Couldn't save your change: ${error.message}`, type: "error" }),
  }), [flash]);
  return { enqueue: queue.enqueue, drain: queue.drain, status };
}
