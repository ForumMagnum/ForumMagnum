// Pangram scores above this threshold get autorejected (see createAutomatedContentEvaluation).
// Lives here rather than in the server-side helpers so that moderation UI can tell
// which rejections were automated.
export const PANGRAM_AUTOREJECT_THRESHOLD = 0.4;
