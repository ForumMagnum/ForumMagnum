import Users from "meteor/vulcan:users";
import { Votes } from "meteor/vulcan:voting";
import { addCallback } from 'meteor/vulcan:core';
import { getVotePower } from '../voting/new_vote_types.js'
import { getCollection } from 'meteor/vulcan:lib';

export const recalculateAFBaseScore = async (document) => {
  let votes = await Votes.find({ documentId: document._id, afPower: {$exists: true} }).fetch()
  return votes ? votes.reduce((sum, vote) => { return vote.afPower + sum}, 0) : 0
}

async function updateAlignmentKarmaServer (newDocument, vote) {
  // Update a
  const voter = Users.findOne(vote.userId)

  if (
    Users.canDo(voter, "votes.alignment") &&
    newDocument.af
  ) {
    const votePower = getVotePower(voter.afKarma, vote.voteType)
    let newAFBaseScore = 0

    if (vote._id) {
      Votes.update({_id:vote._id, documentId: newDocument._id}, {$set:{afPower: votePower}})
      newAFBaseScore = await recalculateAFBaseScore(newDocument)
    } else {
      newAFBaseScore = await recalculateAFBaseScore(newDocument) + votePower
    }

    const collection = getCollection(vote.collectionName)

    collection.update({_id: newDocument._id}, {$set: {afBaseScore: newAFBaseScore}});

    return {
      newDocument:{
        ...newDocument,
        afBaseScore: newAFBaseScore
      },
      vote: {
        ...vote,
        afPower:votePower
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
  return await updateAlignmentKarmaServer(newDocument, vote, 1)
}

addCallback("votes.bigDownvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.bigUpvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.smallDownvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.smallUpvote.sync", updateAlignmentKarmaServerCallback);

async function updateAlignmentUserServer (newDocument, vote, multiplier) {
  if (newDocument.userId != vote.userId) {
    const documentUser = Users.findOne({_id:newDocument.userId})
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
  updateAlignmentUserServer(newDocument, vote, 1)
}

addCallback("votes.bigDownvote.async", updateAlignmentUserServerCallback);
addCallback("votes.bigUpvote.async", updateAlignmentUserServerCallback);
addCallback("votes.smallDownvote.async", updateAlignmentUserServerCallback);
addCallback("votes.smallUpvote.async", updateAlignmentUserServerCallback);

async function cancelAlignmentUserKarmaServer ({newDocument, vote}) {
  updateAlignmentUserServer(newDocument, vote, -1)

}

addCallback("votes.cancel.async", cancelAlignmentUserKarmaServer);

function updateAlignmentKarmaClientCallback (document, collection, voter, voteType) {
  const votePower = getVotePower(voter.afKarma, voteType)

  if (document.af && Users.canDo(voter, "votes.alignment")) {
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

async function cancelAlignmentKarmaServerCallback ({newDocument, vote}) {
  return await updateAlignmentKarmaServer(newDocument, vote, -1)
}

addCallback("votes.cancel.sync", cancelAlignmentKarmaServerCallback);

function cancelAlignmentKarmaClientCallback (document, collection, voter, voteType) {
  const votePower = getVotePower(voter.afKarma, voteType)

  if (document.af && Users.canDo(voter, "votes.alignment")) {
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
