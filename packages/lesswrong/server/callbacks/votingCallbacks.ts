import Users from '../../lib/collections/users/collection';
import { Votes } from '../../lib/collections/votes/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { createNotification } from '../notificationCallbacks';

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]
voteCallbacks.castVoteAsync.add(function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.update({_id: newDocument.userId}, {$inc: {"karma": vote.power}});
  }
});

voteCallbacks.cancelAsync.add(function cancelVoteKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    void Users.update({_id: newDocument.userId}, {$inc: {"karma": -vote.power}});
  }
});


voteCallbacks.castVoteAsync.add(async function incVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.update({_id: vote.userId}, {$inc: {[field]: 1, voteCount: 1}});
  }
});

voteCallbacks.cancelAsync.add(async function cancelVoteCount ({newDocument, vote}: VoteDocTuple) {
  const field = vote.voteType + "Count"

  if (newDocument.userId !== vote.userId) {
    void Users.update({_id: vote.userId}, {$inc: {[field]: -1, voteCount: -1}});
  }
});

voteCallbacks.castVoteAsync.add(async function updateNeedsReview (document: VoteDocTuple) {
  const voter = await Users.findOne(document.vote.userId);
  // voting should only be triggered once (after getting snoozed, they will not re-trigger for sunshine review)
  if (voter && voter.voteCount >= 20 && !voter.reviewedByUserId) {
    void Users.update({_id:voter._id}, {$set:{needsReview: true}})
  }
});

// When a user has voted on tag relevance >15 times, send them a notification
// thanking them for being a tag gnome, and suggesting a config change to make
// tag relevance scores visible in more places.
voteCallbacks.castVoteAsync.add(function checkTagRelevanceVoterNotification({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // Run this async block in the background, without awaiting it
  void (async () => {
    if (!user.sentNotificationAboutTagRelevanceOnPostPages && vote.collectionName === "TagRels") {
      let tagVoteCount = await Votes.find({
        // Non-cancelled votes by this user, on tag-relations
        cancelled: false,
        collectionName: "TagRels",
        userId: vote.userId,
        // Only on tags applied by others, not tag applications
        authorId: {$ne: vote.userId},
      }).count();
      
      console.log(`User has voted on ${tagVoteCount} tagRels`);
      if (tagVoteCount >= 15) {
        await Users.update(
          {_id: user._id},
          {$set: {sentNotificationAboutTagRelevanceOnPostPages: true}}
        );
        
        await sendTagRelevanceVoterNotification(user);
      }
    }
  })();
});

async function sendTagRelevanceVoterNotification(user: DbUser) {
  console.log("Sending tag-gnome voter notification");
  await createNotification({
    userId: user._id,
    notificationType: "youAreATagRelevanceVoter",
    documentType: null,
    documentId: null,
    noEmail: true,
  });
}
