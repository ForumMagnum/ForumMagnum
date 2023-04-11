import Users from "../../../lib/collections/users/collection";
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { Votes } from '../../../lib/collections/votes';
import { commentsAlignmentAsync, postsAlignmentAsync } from '../../resolvers/alignmentForumMutations';
import { getCollection } from '../../vulcan-lib';
import { calculateVotePower } from '../../../lib/voting/voteTypes'
import { getCollectionHooks } from '../../mutationCallbacks';
import { voteCallbacks, VoteDocTuple } from '../../../lib/voting/vote';
import { ensureIndex } from "../../../lib/collectionIndexUtils";

export const recalculateAFBaseScore = async (document: VoteableType): Promise<number> => {
  let votes = await Votes.find({
    documentId: document._id,
    afPower: {$exists: true},
    cancelled: false,
  }).fetch()
  return votes ? votes.reduce((sum, vote) => { return vote.afPower + sum}, 0) : 0
}

async function updateAlignmentKarmaServer (newDocument: DbVoteableType, vote: DbVote): Promise<VoteDocTuple> {
  // Update a
  const voter = await Users.findOne(vote.userId)
  if (!voter) throw Error(`Can't find voter to update Alignment Karma for vote: ${vote}`)

  if (userCanDo(voter, "votes.alignment")) {
    const votePower = calculateVotePower(voter.afKarma, vote.voteType)

    await Votes.rawUpdateOne({_id:vote._id, documentId: newDocument._id}, {$set:{afPower: votePower}})
    const newAFBaseScore = await recalculateAFBaseScore(newDocument)

    const collection = getCollection(vote.collectionName as VoteableCollectionName)

    await collection.rawUpdateOne({_id: newDocument._id}, {$set: {afBaseScore: newAFBaseScore}});

    return {
      newDocument:{
        ...newDocument,
        afBaseScore: newAFBaseScore
      },
      vote: {
        ...vote,
        afPower: votePower
      }
    }
  } else {
    return {
      newDocument,
      vote
    }
  }
}

async function updateAlignmentKarmaServerCallback ({newDocument, vote}: VoteDocTuple) {
  return await updateAlignmentKarmaServer(newDocument, vote)
}

voteCallbacks.castVoteSync.add(updateAlignmentKarmaServerCallback);

async function updateAlignmentUserServer (newDocument: DbVoteableType, vote: DbVote, multiplier: number) {
  if (newDocument.af && (newDocument.userId != vote.userId)) {
    const documentUser = await Users.findOne({_id:newDocument.userId})
    if (!documentUser) throw Error("Can't find user to update Alignment Karma")
    const newAfKarma = (documentUser.afKarma || 0) + ((vote.afPower || 0) * multiplier)
    if (newAfKarma > 0) {
      await Users.rawUpdateOne({_id:newDocument.userId}, {
        $set: {afKarma: newAfKarma },
        $addToSet: {groups: 'alignmentVoters'}
      })
    } else {
      await Users.rawUpdateOne({_id:newDocument.userId}, {
        $set: {afKarma: newAfKarma },
        $pull: {groups: 'alignmentVoters'}
      })
    }
  }
}

async function updateAlignmentUserServerCallback ({newDocument, vote}: VoteDocTuple) {
  await updateAlignmentUserServer(newDocument, vote, 1)
}

voteCallbacks.castVoteAsync.add(updateAlignmentUserServerCallback);

async function cancelAlignmentUserKarmaServer ({newDocument, vote}: VoteDocTuple) {
  await updateAlignmentUserServer(newDocument, vote, -1)

}

voteCallbacks.cancelAsync.add(cancelAlignmentUserKarmaServer);

voteCallbacks.cancelSync.add(function cancelAlignmentKarmaServerCallback({newDocument, vote}: VoteDocTuple) {
  void updateAlignmentKarmaServer(newDocument, vote)
});


async function MoveToAFUpdatesUserAFKarma (document: DbPost|DbComment, oldDocument: DbPost|DbComment) {
  if (document.af && !oldDocument.af) {
    await Users.rawUpdateOne({_id:document.userId}, {
      $inc: {afKarma: document.afBaseScore || 0},
      $addToSet: {groups: 'alignmentVoters'}
    })
    await Votes.rawUpdateMany({documentId: document._id}, {
      $set: {documentIsAf: true}
    }, {multi: true})
  } else if (!document.af && oldDocument.af) {
    const documentUser = await Users.findOne({_id:document.userId})
    if (!documentUser) throw Error("Can't find user for updating karma after moving document to AIAF")
    const newAfKarma = (documentUser.afKarma || 0) - (document.afBaseScore || 0)
    if (newAfKarma > 0) {
      await Users.rawUpdateOne({_id:document.userId}, {$inc: {afKarma: -document.afBaseScore || 0}})
    } else {
      await Users.rawUpdateOne({_id:document.userId}, {
        $inc: {afKarma: -document.afBaseScore || 0},
        $pull: {groups: 'alignmentVoters'}
      })
    }
    await Votes.rawUpdateMany({documentId: document._id}, {
      $set: {documentIsAf: false}
    }, {multi: true})
  }
}
ensureIndex(Votes, {documentId:1});

commentsAlignmentAsync.add(MoveToAFUpdatesUserAFKarma);
getCollectionHooks("Posts").editAsync.add(MoveToAFUpdatesUserAFKarma);
postsAlignmentAsync.add(MoveToAFUpdatesUserAFKarma);
