import { userIsAdmin } from "@/lib/vulcan-users/permissions";

/**
 * The author of a TypoSuggestion's target document (or any admin) can read
 * and resolve the suggestion. Used by the schema's `canRead` checks, the
 * collection access filter, and the resolve-mutation authorization gate.
 */
export function userCanAccessTypoSuggestion(
  user: DbUser | UsersCurrent | null,
  suggestion: { authorId: string },
): boolean {
  if (!user) return false;
  if (userIsAdmin(user)) return true;
  return user._id === suggestion.authorId;
}
