// Pangram scores above this get autorejected.
export const PANGRAM_AUTOREJECT_THRESHOLD = 0.4;

/**
 * Cap on how much text we send to Pangram, roughly 4-5k words. Longer texts get
 * truncated; checking an entire long post in one go isn't usually worth the extra $$$.
 */
export const PANGRAM_MAX_CHARS = 30_000;

/**
 * Which Pangram model to run text through. `pangram3` is the cheap synchronous
 * v3 endpoint that all of our automated checks use; `pangram4` is the newer,
 * much more accurate model, which costs roughly ten times as much per word and
 * is only run when someone explicitly asks for it (currently from /admin/pangram).
 */
export const PANGRAM_MODELS = ["pangram3", "pangram4"] as const;

export type PangramModel = typeof PANGRAM_MODELS[number];

export const DEFAULT_PANGRAM_MODEL: PangramModel = "pangram3";

export const pangramModelLabels: Record<PangramModel, string> = {
  pangram3: "Pangram 3 (cheap)",
  pangram4: "Pangram 4 (~10x the cost, more accurate)",
};
