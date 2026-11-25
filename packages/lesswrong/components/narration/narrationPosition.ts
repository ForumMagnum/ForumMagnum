/**
 * Where on the page narration is currently reading, for the parts of the page
 * outside the player that show it (the mark in the table of contents'
 * progress bar). The player and the post page are in separate parts of the
 * React tree, so this is shared through a module-level value with
 * subscribers rather than through context.
 */
let positionRange: Range|null = null;
const listeners = new Set<() => void>();

export function getNarrationPositionRange(): Range|null {
  return positionRange;
}

export function setNarrationPositionRange(range: Range|null) {
  positionRange = range;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToNarrationPosition(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
