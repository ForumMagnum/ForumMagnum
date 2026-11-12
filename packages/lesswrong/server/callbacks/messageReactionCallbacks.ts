import type { VoteDocTuple } from "@/lib/voting/vote";
import type { NamesAttachedReactionsVote, UserVoteOnSingleReaction } from "@/lib/voting/namesAttachedReactions";
import { getNamesAttachedReactionsByName } from "@/lib/voting/reactions";
import { createNotification } from "../notificationCallbacksHelpers";

function getReactsList(extendedVote: NamesAttachedReactionsVote | null | undefined): UserVoteOnSingleReaction[] {
  return extendedVote?.reacts ?? [];
}

/**
 * Return the names of reacts present in this vote that weren't present in the
 * user's previous (now-cancelled) vote on the same message.
 */
async function findNewReactNames(vote: DbVote, context: ResolverContext): Promise<string[]> {
  const newReactNames = getReactsList(vote.extendedVoteType as NamesAttachedReactionsVote | null).map(r => r.react);
  if (newReactNames.length === 0) return [];

  const priorVote = await context.Votes.findOne(
    {
      _id: { $ne: vote._id },
      documentId: vote.documentId,
      collectionName: vote.collectionName,
      userId: vote.userId,
    },
    { sort: { votedAt: -1 } },
  );
  const priorReactNames = new Set(getReactsList(priorVote?.extendedVoteType as NamesAttachedReactionsVote | null).map(r => r.react));
  return [...new Set(newReactNames)].filter(name => !priorReactNames.has(name));
}

/**
 * When someone adds a reaction to a private message, notify the message's
 * author (on-site only). Each (reactor, message, react) combination notifies
 * at most once, so toggling a react on and off doesn't generate repeated
 * notifications.
 */
export async function maybeNotifyMessageReaction({ vote, newDocument }: VoteDocTuple, context: ResolverContext): Promise<void> {
  if (vote.collectionName !== "Messages" || vote.cancelled) return;

  const message = newDocument as DbMessage;
  const authorId = message.userId;
  if (!authorId || authorId === vote.userId) return;

  const conversation = await context.Conversations.findOne(message.conversationId);
  if (!conversation?.participantIds?.includes(vote.userId) || !conversation.participantIds.includes(authorId)) return;

  const newReactNames = await findNewReactNames(vote, context);
  if (newReactNames.length === 0) return;

  const existingNotifications = await context.Notifications.find(
    { userId: authorId, type: "newMessageReaction", documentId: message._id },
    {},
    { extraData: 1 },
  ).fetch();
  const alreadyNotifiedReactNames = new Set(existingNotifications
    .filter(n => n.extraData?.reactorId === vote.userId)
    .map(n => n.extraData?.reactName));

  for (const reactName of newReactNames) {
    if (alreadyNotifiedReactNames.has(reactName)) continue;
    await createNotification({
      userId: authorId,
      notificationType: "newMessageReaction",
      documentType: "message",
      documentId: message._id,
      extraData: {
        reactorId: vote.userId,
        reactName,
        reactLabel: getNamesAttachedReactionsByName(reactName).label,
      },
      noEmail: true,
      context,
    });
  }
}
