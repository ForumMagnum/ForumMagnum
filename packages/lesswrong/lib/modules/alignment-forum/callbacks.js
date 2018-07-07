import Users from "meteor/vulcan:users";
import { Votes } from "meteor/vulcan:voting";
import { addCallback } from 'meteor/vulcan:core';
import { getVotePower } from '../voting/new_vote_types.js'
import { getCollection } from 'meteor/vulcan:lib';

export const recalculateAFBaseScore = async (document) => {
  let votes = await Votes.find({ documentId: document._id, afPower: {$exists: true} }).fetch()
  return votes ? votes.reduce((sum, vote) => { return vote.afPower + sum}, 0) : 0
}

async function updateAlignmentKarmaServer (newDocument, vote, userMultiplier) {
  // Update a
  const voter = Users.findOne(vote.userId)
  const author = Users.findOne(newDocument.userId)
  if (
    Users.canDo(voter, "votes.alignment") &&
    Users.canDo(author, "votes.alignment") &&
    newDocument.af
  ) {
    const votePower = getVotePower(voter.afKarma, vote.voteType)
    Votes.update({_id:vote._id}, {$set:{afPower: votePower}})

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

async function updateAlignmentUserKarmaServer ({newDocument, vote}) {
  if (newDocument.userId != vote.userId) {
    Users.update({_id:newDocument.userId}, {$inc:{afKarma: vote.afPower || 0}})
  }
}

addCallback("votes.bigDownvote.async", updateAlignmentUserKarmaServer);
addCallback("votes.bigUpvote.async", updateAlignmentUserKarmaServer);
addCallback("votes.smallDownvote.async", updateAlignmentUserKarmaServer);
addCallback("votes.smallUpvote.async", updateAlignmentUserKarmaServer);

async function cancelAlignmentUserKarmaServer ({newDocument, vote}) {
  if (newDocument.userId != vote.userId) {
    Users.update({_id:newDocument.userId}, {$inc:{afKarma: -vote.afPower || 0}})
  }
}

addCallback("votes.cancel.async", cancelAlignmentUserKarmaServer);

function updateAlignmentKarmaClientCallback (document, collection, voter, voteType) {
  const votePower = getVotePower(voter.afKarma, voteType)

  return {
    ...document,
    afBaseScore: (document.afBaseScore || 0) + votePower,
  };
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
  return {
    ...document,
    afBaseScore: document.afBaseScore - votePower,
  };
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
