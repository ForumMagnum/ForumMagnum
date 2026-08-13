// Curated set of "library topics" for the /library page redesign. Each
// sequence (and collection) gets at most one topic, set by mods, which is
// rendered as the row's topic pill and drives the tag filter. The stored
// value is the display string.
export const LIBRARY_TOPICS = [
  "AI Alignment",
  "Epistemics",
  "Rationality",
  "Practical",
  "World Modeling",
  "Fiction",
  "Decision Theory",
  "Forecasting",
  "Mathematics",
  "Community",
  "Site Meta",
] as const;

export type LibraryTopic = typeof LIBRARY_TOPICS[number];
