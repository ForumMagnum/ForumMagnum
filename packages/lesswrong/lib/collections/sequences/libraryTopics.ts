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

// (topic, slug) VALUES list for SQL that needs the mapping inline (the
// libraryTopics sqlResolver, which can't take query parameters). Topic names
// and slugs are compile-time constants, so inlining is injection-safe.
export const libraryTopicTagValuesSql = LIBRARY_TOPICS
  .map(topic => `('${topic}', '${LIBRARY_TOPIC_TAG_SLUGS[topic]}')`)
  .join(", ");
