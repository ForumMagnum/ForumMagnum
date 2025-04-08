import { REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD } from '@/lib/reviewUtils';
import { AfterCreateCallbackProperties } from '../mutationCallbacks';
import { createNotifications } from '../notificationCallbacksHelpers';

export async function ensureUniqueVotes(newVote: Partial<DbReviewVote>, context: ResolverContext) {
  const { ReviewVotes } = context;
  const {userId, postId} = newVote
  const oldVote = await ReviewVotes.findOne({postId, userId})
  if (oldVote) throw Error("You can't have two review votes of the same type on the same document");
}

// This may have been sending out duplicate notifications in previous years, maybe just be because this was implemented partway into the review, and some posts slipped through that hadn't previously gotten voted on.
export async function positiveReviewVoteNotifications(reviewVote: DbReviewVote, currentUser: DbUser | null, _: CollectionBase<"ReviewVotes">, { context }: AfterCreateCallbackProperties<"ReviewVotes">) {
  const { Posts, Notifications } = context;
  const post = reviewVote.postId ? await Posts.findOne(reviewVote.postId) : null;
  if (post && post.positiveReviewVoteCount >= REVIEW_AND_VOTING_PHASE_VOTECOUNT_THRESHOLD) {
    const notifications = await Notifications.find({documentId:post._id, type: "postNominated" }).fetch()
    if (!notifications.length) {
      await createNotifications({userIds: [post.userId], notificationType: "postNominated", documentType: "post", documentId: post._id})
    }
  }
}
