import Users from "../../../lib/collections/users/collection";
import { userCanDo } from '../../../lib/vulcan-users/permissions';
import { Votes } from '../../../lib/collections/votes';
import { addCallback, getCollection } from '../../vulcan-lib';
import { getVotePower } from '../../../lib/voting/new_vote_types'
import { getCollectionHooks } from '../../mutationCallbacks';

export const recalculateAFBaseScore = async (document) => {
  let votes = await Votes.find({
    documentId: document._id,
    afPower: {$exists: true},
    cancelled: false,
  }).fetch()
  return votes ? votes.reduce((sum, vote) => { return vote.afPower + sum}, 0) : 0
}

async function updateAlignmentKarmaServer (newDocument, vote) {
  // Update a
  const voter = Users.findOne(vote.userId)
  if (!voter) throw Error(`Can't find voter to update Alignment Karma for vote: ${vote}`)

  if (userCanDo(voter, "votes.alignment")) {
    const votePower = getVotePower(voter.afKarma, vote.voteType)

    Votes.update({_id:vote._id, documentId: newDocument._id}, {$set:{afPower: votePower}})
    const newAFBaseScore = await recalculateAFBaseScore(newDocument)

    const collection = getCollection(vote.collectionName)

    collection.update({_id: newDocument._id}, {$set: {afBaseScore: newAFBaseScore}});

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

async function updateAlignmentKarmaServerCallback ({newDocument, vote}) {
  return await updateAlignmentKarmaServer(newDocument, vote)
}

addCallback("votes.bigDownvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.bigUpvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.smallDownvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.smallUpvote.sync", updateAlignmentKarmaServerCallback);

async function updateAlignmentUserServer (newDocument, vote, multiplier) {
  if (newDocument.af && (newDocument.userId != vote.userId)) {
    const documentUser = Users.findOne({_id:newDocument.userId})
    if (!documentUser) throw Error("Can't find user to update Alignment Karma")
    const newAfKarma = (documentUser.afKarma || 0) + ((vote.afPower || 0) * multiplier)
    if (newAfKarma > 0) {
      Users.update({_id:newDocument.userId}, {
        $set: {afKarma: newAfKarma },
        $addToSet: {groups: 'alignmentVoters'}
      })
    } else {
      Users.update({_id:newDocument.userId}, {
        $set: {afKarma: newAfKarma },
        $pull: {groups: 'alignmentVoters'}
      })
    }
  }
}

async function updateAlignmentUserServerCallback ({newDocument, vote}) {
  await updateAlignmentUserServer(newDocument, vote, 1)
}

addCallback("votes.bigDownvote.async", updateAlignmentUserServerCallback);
addCallback("votes.bigUpvote.async", updateAlignmentUserServerCallback);
addCallback("votes.smallDownvote.async", updateAlignmentUserServerCallback);
addCallback("votes.smallUpvote.async", updateAlignmentUserServerCallback);

async function cancelAlignmentUserKarmaServer ({newDocument, vote}) {
  await updateAlignmentUserServer(newDocument, vote, -1)

}

addCallback("votes.cancel.async", cancelAlignmentUserKarmaServer);

function updateAlignmentKarmaClientCallback (document, collection, voter, voteType) {
  const votePower = getVotePower(voter.afKarma, voteType)

  if (document.af && userCanDo(voter, "votes.alignment")) {
    return {
      ...document,
      afBaseScore: (document.afBaseScore || 0) + (votePower || 0),
    };
  } else {
    return document
  }
}

addCallback("votes.bigDownvote.client", updateAlignmentKarmaClientCallback);
addCallback("votes.bigUpvote.client", updateAlignmentKarmaClientCallback);
addCallback("votes.smallDownvote.client", updateAlignmentKarmaClientCallback);
addCallback("votes.smallUpvote.client", updateAlignmentKarmaClientCallback);

function cancelAlignmentKarmaServerCallback ({newDocument, vote}) {
  void updateAlignmentKarmaServer(newDocument, vote)
}

addCallback("votes.cancel.sync", cancelAlignmentKarmaServerCallback);

function cancelAlignmentKarmaClientCallback (document, collection, voter, voteType) {
  const votePower = getVotePower(voter.afKarma, voteType)

  if (document.af && userCanDo(voter, "votes.alignment")) {
    return {
      ...document,
      afBaseScore: (document.afBaseScore || 0) - (votePower || 0),
    };
  } else {
    return document
  }

}

addCallback("votes.cancel.client", cancelAlignmentKarmaClientCallback);

function clearAlignmentKarmaClientCallback (document, collection, voter) {
  let newDocument = { ...document }
  document.currentUserVotes.forEach((vote)=> {
    newDocument = cancelAlignmentKarmaClientCallback(document, collection, voter, vote.voteType)
  })
  return newDocument
}

addCallback("votes.clear.client", clearAlignmentKarmaClientCallback);


async function MoveToAFUpdatesUserAFKarma (document, oldDocument) {
  if (document.af && !oldDocument.af) {
    await Users.update({_id:document.userId}, {
      $inc: {afKarma: document.afBaseScore || 0},
      $addToSet: {groups: 'alignmentVoters'}
    })
    await Votes.update({documentId: document._id}, {
      $set: {documentIsAf: true}
    }, {multi: true})
  } else if (!document.af && oldDocument.af) {
    const documentUser = Users.findOne({_id:document.userId})
    if (!documentUser) throw Error("Can't find user for updating karma after moving document to AIAF")
    const newAfKarma = (documentUser.afKarma || 0) - (document.afBaseScore || 0)
    if (newAfKarma > 0) {
      await Users.update({_id:document.userId}, {$inc: {afKarma: -document.afBaseScore || 0}})
    } else {
      await Users.update({_id:document.userId}, {
        $inc: {afKarma: -document.afBaseScore || 0},
        $pull: {groups: 'alignmentVoters'}
      })
    }
    await Votes.update({documentId: document._id}, {
      $set: {documentIsAf: false}
    }, {multi: true})
  }
}

addCallback("comments.alignment.async", MoveToAFUpdatesUserAFKarma);
addCallback("comments.alignment.async", MoveToAFUpdatesUserAFKarma);
getCollectionHooks("Posts").editAsync.add(MoveToAFUpdatesUserAFKarma);
addCallback("posts.alignment.async", MoveToAFUpdatesUserAFKarma);
