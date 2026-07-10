import { TupleSet, UnionOf } from "@/lib/utils/typeGuardUtils";

export const typoSuggestionTargetCollections = new TupleSet(["Posts", "Comments"] as const);
export type TypoSuggestionTargetCollection = UnionOf<typeof typoSuggestionTargetCollections>;

export const typoSuggestionStatuses = new TupleSet([
  "pending",
  "accepted",
  "accepted_as_suggestion",
  "rejected",
  "stale",
  "failed",
] as const);
export type TypoSuggestionStatus = UnionOf<typeof typoSuggestionStatuses>;

export const typoSuggestionVerdicts = new TupleSet([
  "pending",
  "fix_typo",
  "no_typo",
  "error",
] as const);
export type TypoSuggestionVerdict = UnionOf<typeof typoSuggestionVerdicts>;

export const typoAcceptModes = new TupleSet(["APPLY", "SUGGEST"] as const);
export type TypoAcceptMode = UnionOf<typeof typoAcceptModes>;
