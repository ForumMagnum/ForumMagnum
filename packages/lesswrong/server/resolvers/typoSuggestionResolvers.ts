import gql from "graphql-tag";
import TypoSuggestions from "@/server/collections/typoSuggestions/collection";
import { antiReactToTypoOnOwnContent } from "@/server/typoSuggestions/antiReact";
import { userCanAccessTypoSuggestion } from "@/lib/collections/typoSuggestions/helpers";
import type { TypoAcceptMode, TypoSuggestionTargetCollection } from "@/lib/collections/typoSuggestions/constants";

async function loadAndAuthorizeSuggestion(
  suggestionId: string,
  context: ResolverContext,
): Promise<{ suggestion: DbTypoSuggestion; currentUser: DbUser } | null> {
  const { currentUser } = context;
  if (!currentUser) throw new Error("Must be logged in to resolve a typo suggestion.");
  const suggestion = await TypoSuggestions.findOne(suggestionId);
  if (!suggestion) throw new Error("TypoSuggestion not found.");
  if (!userCanAccessTypoSuggestion(currentUser, suggestion)) {
    throw new Error("You don't have permission to resolve this typo suggestion.");
  }
  // No-op for double-clicks / replays.
  if (suggestion.status !== "pending") return null;
  return { suggestion, currentUser };
}

async function acceptTypoSuggestionResolver(
  _root: void,
  { suggestionId, mode }: { suggestionId: string; mode: TypoAcceptMode },
  context: ResolverContext,
) {
  const authorized = await loadAndAuthorizeSuggestion(suggestionId, context);
  if (!authorized) {
    return TypoSuggestions.findOne(suggestionId);
  }
  const { suggestion, currentUser } = authorized;

  if (suggestion.collectionName === "Comments" && mode === "SUGGEST") {
    throw new Error("'Open in editor' is not supported for comments. Use 'Apply' instead.");
  }

  // Dynamic import: see typoSuggestionCallbacks.ts for why.
  const { applyTypoSuggestion } = await import("@/server/typoSuggestions/applyTypoSuggestion");
  const updated = await applyTypoSuggestion({
    suggestion,
    mode,
    resolvedByUserId: currentUser._id,
    context,
  });
  if (!updated) throw new Error("TypoSuggestion disappeared after update.");
  return updated;
}

async function rejectTypoSuggestionResolver(
  _root: void,
  { suggestionId }: { suggestionId: string },
  context: ResolverContext,
) {
  const authorized = await loadAndAuthorizeSuggestion(suggestionId, context);
  if (!authorized) {
    return TypoSuggestions.findOne(suggestionId);
  }
  const { suggestion, currentUser } = authorized;

  await TypoSuggestions.rawUpdateOne(
    { _id: suggestionId },
    {
      $set: {
        status: "rejected",
        resolvedByUserId: currentUser._id,
        resolvedAt: new Date(),
      },
    },
  );

  // Author dismissed the suggestion — anti-react so the original typo react
  // drops out of the public display.
  await antiReactToTypoOnOwnContent({
    collectionName: suggestion.collectionName as TypoSuggestionTargetCollection,
    documentId: suggestion.documentId,
    quote: suggestion.quote,
    user: currentUser,
    context,
  });

  return TypoSuggestions.findOne(suggestionId);
}

export const graphqlTypoSuggestionMutationTypeDefs = gql`
  enum TypoAcceptMode {
    APPLY
    SUGGEST
  }

  extend type Mutation {
    acceptTypoSuggestion(suggestionId: String!, mode: TypoAcceptMode!): TypoSuggestion!
    rejectTypoSuggestion(suggestionId: String!): TypoSuggestion!
  }
`;

export const typoSuggestionGqlMutations = {
  acceptTypoSuggestion: acceptTypoSuggestionResolver,
  rejectTypoSuggestion: rejectTypoSuggestionResolver,
};
