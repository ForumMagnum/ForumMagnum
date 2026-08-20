// Pangram scores above this get autorejected.
export const PANGRAM_AUTOREJECT_THRESHOLD = 0.4;

/**
 * Cap on how much text we send to Pangram. Longer texts are truncated to keep
 * the cost of a single check bounded.
 */
export const PANGRAM_MAX_CHARS = 30_000;

export type PangramModel = "pangram3" | "pangram4";

export const PANGRAM_MODELS: readonly PangramModel[] = ["pangram3", "pangram4"];

export const DEFAULT_PANGRAM_MODEL: PangramModel = "pangram3";

export const pangramModelLabels: Record<PangramModel, string> = {
  pangram3: "Pangram 3 (cheap)",
  pangram4: "Pangram 4 (~10x the cost, more accurate)",
};
