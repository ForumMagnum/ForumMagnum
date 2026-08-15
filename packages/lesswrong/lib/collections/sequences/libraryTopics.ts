// Curated set of "library topics" for the /library page redesign, rendered
// as row topic pills and driving the tag filter. Sequences derive their
// topics from their posts' tags (see LIBRARY_TOPIC_TAG_SLUGS); collections
// still get at most one topic set by mods, stored as the display string.
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

// The Fiction tag is treated as an eighth core tag by the derived sequence
// tagging (SequencesRepo.getDerivedTags) even though Tags.core is false on
// it, both when deriving and when styling core-tag chips.
export const FICTION_TAG_SLUG = "fiction";

// The /library topic filter's chips: the 7 Tags.core tags plus Fiction,
// matched by name against the derived sequence tags so the filter can never
// disagree with the chips shown on rows. Ordered by sitewide prevalence.
export const LIBRARY_CORE_TAG_NAMES = [
  "AI",
  "World Modeling",
  "Rationality",
  "World Optimization",
  "Practical",
  "Community",
  "Fiction",
  "Site Meta",
] as const;

export const isCoreLibraryTag = (tag: { core: boolean, slug: string }): boolean =>
  tag.core || tag.slug === FICTION_TAG_SLUG;

export const isLibraryTopic = (value: string): value is LibraryTopic =>
  LIBRARY_TOPICS.some(topic => topic === value);

// The tag whose presence on a sequence's posts gives the sequence that
// topic: a sequence holds a topic when at least half its posts have the
// mapped tag (with positive tagRelevance).
export const LIBRARY_TOPIC_TAG_SLUGS: Record<LibraryTopic, string> = {
  "AI Alignment": "ai",
  "Epistemics": "epistemology",
  "Rationality": "rationality",
  "Practical": "practical",
  "World Modeling": "world-modeling",
  "Fiction": "fiction",
  "Decision Theory": "decision-theory",
  "Forecasting": "forecasting-and-prediction",
  "Mathematics": "logic-and-mathematics",
  "Community": "community",
  "Site Meta": "site-meta",
};
