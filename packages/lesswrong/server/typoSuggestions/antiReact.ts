import type { NamesAttachedReactionsVote, UserVoteOnSingleReaction } from "@/lib/voting/namesAttachedReactions";
import type { TypoSuggestionTargetCollection } from "@/lib/collections/typoSuggestions/constants";
import Votes from "@/server/collections/votes/collection";
import Posts from "@/server/collections/posts/collection";
import Comments from "@/server/collections/comments/collection";
import { performVoteServer } from "@/server/voteServer";
import { captureException } from "@/lib/sentryWrapper";

const TYPO_REACT_NAME = "typo";

/**
 * Express the current user's disagreement with a typo react on their own
 * document by casting an anti-react vote (`vote: "disagreed"`). Used after
 * the document author resolves a typo suggestion (Apply, Open in editor, or
 * Reject) so the original typo react drops out of the displayed reacts.
 *
 * `reactionsListToDisplayedNumbers` (`reactionDisplayHelpers.tsx`) computes
 * a net score per react bucket; when the author's "disagreed" cancels the
 * single reactor's "created", the bucket disappears from the public display.
 *
 * For multi-reactor cases (rare; same-quote pile-on) the bucket may still
 * show, just with one less vote. That's an acceptable degradation.
 *
 * Soft-fails on errors: if anti-react can't be cast, the resolution still
 * stands; the typo react just stays visible.
 */
export async function antiReactToTypoOnOwnContent({
  collectionName,
  documentId,
  quote,
  user,
  context,
}: {
  collectionName: TypoSuggestionTargetCollection;
  documentId: string;
  quote: string;
  user: DbUser;
  context: ResolverContext;
}): Promise<void> {
  const document = collectionName === "Posts"
    ? await Posts.findOne({ _id: documentId })
    : await Comments.findOne({ _id: documentId });
  if (!document) return;
  const collection = collectionName === "Posts" ? Posts : Comments;

  // Merge with the user's existing reacts on this document so we don't
  // wipe other reacts they've previously left.
  const existingVote = await Votes.findOne(
    { documentId, collectionName, userId: user._id, cancelled: false },
    { sort: { votedAt: -1 } },
  );
  const existingExtended = existingVote?.extendedVoteType as NamesAttachedReactionsVote | null;
  const existingReacts: UserVoteOnSingleReaction[] = existingExtended?.reacts ?? [];

  const newReacts: UserVoteOnSingleReaction[] = [
    ...existingReacts.filter(
      (r) =>
        !(r.react === TYPO_REACT_NAME && (r.quotes?.[0] ?? "") === quote),
    ),
    { react: TYPO_REACT_NAME, vote: "disagreed", quotes: [quote] },
  ];

  const newExtended: NamesAttachedReactionsVote = {
    ...existingExtended,
    reacts: newReacts,
  };

  // performVoteServer can throw on validation paths (banned user, debate
  // coauthor checks, extended-vote validation). Don't fail the whole resolve
  // flow if those fire — the typo suggestion stands either way.
  try {
    await performVoteServer({
      document,
      voteType: existingVote?.voteType ?? "neutral",
      extendedVote: newExtended,
      collection,
      user,
      toggleIfAlreadyVoted: false,
      skipRateLimits: true,
      context,
    });
  } catch (err) {
    captureException(err);
  }
}
