import Users from "meteor/vulcan:users";
import { Votes } from "meteor/vulcan:voting";
import { addCallback } from 'meteor/vulcan:core';
import { getVotePower } from '../voting/new_vote_types.js'
import { getCollection } from 'meteor/vulcan:lib';

export const recalculateAFBaseScore = (document) => {
  const votes = Votes.find({ documentId: document._id, afPower: {$exists: true} }).fetch() || [];
  return votes.reduce((sum, vote) => { return vote.afPower + sum}, 0)
}

function updateAlignmentKarmaServer (newDocument, vote, userMultiplier) {
  const voter = Users.findOne(vote.userId)
  const author = Users.findOne(newDocument.userId)
  if (
    Users.canDo(voter, "votes.alignment") &&
    Users.canDo(author, "votes.alignment") &&
    newDocument.af
  ) {
    const votePower = getVotePower(voter.afKarma, vote.voteType)
    Votes.update({_id:vote._id}, {$set:{afPower: votePower}})

    const newAFBaseScore = recalculateAFBaseScore(newDocument)

    const collection = getCollection(vote.collectionName)

    collection.update({_id: newDocument._id}, {$set: {afBaseScore: newAFBaseScore}});
    Users.update({_id:author._id}, {$inc:{afKarma: userMultiplier * votePower}})

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
  }
}

function updateAlignmentKarmaServerCallback ({newDocument, vote}) {
  return updateAlignmentKarmaServer(newDocument, vote, 1)
}

addCallback("votes.bigDownvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.bigUpvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.smallDownpvote.sync", updateAlignmentKarmaServerCallback);
addCallback("votes.smallUpvote.sync", updateAlignmentKarmaServerCallback);

function updateAlignmentKarmaClientCallback (document, collection, voter, voteType) {
  const votePower = getVotePower(voter.afKarma, voteType)
  return {
    ...document,
    afBaseScore: document.afBaseScore + votePower,
  };
}

addCallback("votes.bigDownvote.client", updateAlignmentKarmaClientCallback);
addCallback("votes.bigUpvote.client", updateAlignmentKarmaClientCallback);
addCallback("votes.smallDownpvote.client", updateAlignmentKarmaClientCallback);
addCallback("votes.smallUpvote.client", updateAlignmentKarmaClientCallback);

function cancelAlignmentKarmaCallback ({newDocument, vote}) {
  return updateAlignmentKarmaServer(newDocument, vote, -1)
}

addCallback("votes.cancel.sync", cancelAlignmentKarmaCallback);






// const updateAlignmentKarmaClientCallback = ({ document, collection, voteType, user, voteId }) => {
//
  // const newDocument = {
  //   ...document,
  //   baseScore: document.baseScore || 0,
  //   __typename: collection.options.typeName,
  //   currentUserVotes: document.currentUserVotes || [],
  // };
  //
  // // create new vote and add it to currentUserVotes array
  // const vote = createVote({ document, collectionName: collection.options.collectionName, voteType, user, voteId });
  // newDocument.currentUserVotes = [...newDocument.currentUserVotes, vote];
  //
  // // increment baseScore
  // newDocument.baseScore += vote.power;
  // newDocument.score = recalculateScore(newDocument);
  //
  // return newDocument;
// }
