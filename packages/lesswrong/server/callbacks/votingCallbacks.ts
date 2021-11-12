import moment from 'moment';
import Notifications from '../../lib/collections/notifications/collection';
import Users from '../../lib/collections/users/collection';
import { voteCallbacks, VoteDocTuple } from '../../lib/voting/vote';
import { userSmallVotePower } from '../../lib/voting/voteTypes';
import { createNotification } from '../notificationCallbacks';

/**
 * @summary Update the karma of the item's owner
 * @param {object} item - The item being operated on
 * @param {object} user - The user doing the operation
 * @param {object} collection - The collection the item belongs to
 * @param {string} operation - The operation being performed
 */
const collectionsThatAffectKarma = ["Posts", "Comments", "Revisions"]
voteCallbacks.castVoteAsync.add(async function updateKarma({newDocument, vote}: VoteDocTuple, collection: CollectionBase<DbVoteableType>, user: DbUser) {
  // only update karma is the operation isn't done by the item's author
  if (newDocument.userId !== vote.userId && collectionsThatAffectKarma.includes(vote.collectionName)) {
    const oldKarma = (await Users.findOne({_id: newDocument.userId}))?.karma!;
    void Users.update({_id: newDocument.userId}, {$inc: {"karma": vote.power}});
    const newKarma = oldKarma + vote.power;
    userKarmaChangedFrom(newDocument.userId, oldKarma, newKarma);
  }
});

async function userKarmaChangedFrom(userId: string, oldKarma: number, newKarma: number) {
  if (userSmallVotePower(oldKarma, 1) < userSmallVotePower(newKarma, 1)) {
    // TODO: check if there's already a notification
    const yesterday = moment().subtract(1, 'days').toDate();
    const existingNotificationCount = await Notifications.find({userId, type: 'karmaPowersGained', createdAt: {$gt: yesterday}}).count();
    if (existingNotificationCount === 0) {
      await createNotification({userId, notificationType: 'karmaPowersGained', documentType: null, documentId: null})
    }
  }
};

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
