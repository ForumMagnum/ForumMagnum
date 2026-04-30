import { postGetPageUrl } from "@/lib/collections/posts/helpers";

interface TypoSuggestionContext {
  reactorName: string;
  /** Human-readable label for the document the typo is in, e.g. `your post "Foo"`. */
  targetDescription: string;
  /** URL the notification row should link to. */
  targetUrl: string;
}

/**
 * Resolve the human-readable context (reactor display name, target document
 * description, and target URL) for a typo suggestion notification. Used by
 * both `TypoSuggestionNotification.getMessage` and the `typoSuggestion` case
 * in the `getLink` helper.
 */
export async function getTypoSuggestionNotificationContext(
  suggestionId: string | null,
  context: ResolverContext,
): Promise<TypoSuggestionContext | null> {
  if (!suggestionId) return null;
  const suggestion = await context.TypoSuggestions.findOne(suggestionId);
  if (!suggestion) return null;

  let reactorName = "A reader";
  if (suggestion.voteId) {
    const vote = await context.Votes.findOne(suggestion.voteId);
    if (vote) {
      const reactor = await context.loaders.Users.load(vote.userId);
      if (reactor?.displayName) reactorName = reactor.displayName;
    }
  }

  let targetDescription = "your post";
  let targetUrl = "/notifications";
  if (suggestion.collectionName === "Posts") {
    const post = await context.loaders.Posts.load(suggestion.documentId);
    if (post) {
      const title = post.title?.trim() || "(untitled)";
      targetDescription = `your post "${title}"`;
      targetUrl = postGetPageUrl(post);
    }
  } else if (suggestion.collectionName === "Comments") {
    const comment = await context.loaders.Comments.load(suggestion.documentId);
    if (comment?.postId) {
      const post = await context.loaders.Posts.load(comment.postId);
      targetDescription = post
        ? `your comment on "${post.title?.trim() || "(untitled)"}"`
        : "your comment";
      if (post) {
        targetUrl = `${postGetPageUrl(post)}?commentId=${comment._id}`;
      }
    } else {
      targetDescription = "your comment";
    }
  }
  return { reactorName, targetDescription, targetUrl };
}
