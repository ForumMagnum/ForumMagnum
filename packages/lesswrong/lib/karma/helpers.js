import { Collections } from 'meteor/vulcan:core';

/**
 * @summary Check if a user has upvoted a document
 * @param {Object} user
 * @param {Object} document
 * @returns {Boolean}
 */

const log = console.log;

const hasUpvoted = (user, document) => {
  // note(apollo): check upvoters depending if the document is queried by mongo directly or fetched by an apollo resolver
  return user && document.upvoters && !!document.upvoters.find(u => typeof u === 'string' ? u === user._id : u._id === user._id);
};

const hasDownvotedNew = (user, votes) => {
  // log("hasDownvotedNew!");
  // log("# of votes: ", votes.length);
  return user && _.any(votes, vote => (vote.userId == user._id && vote.voteType == "downvote"));
};

/**
 * @summary Check if a user has downvoted a document
 * @param {Object} user
 * @param {Object} document
 * @returns {Boolean}
 */
const hasDownvoted = (user, document) => {
  // note(apollo): check downvoters depending if the document is queried by mongo directly or fetched by an apollo resolver
  return user && document.downvoters && !!document.downvoters.find(u => typeof u === 'string' ? u === user._id : u._id === user._id);
};


const hasUpvotedNew = (user, votes) => {
  // log("hasUpvotedNew!");
  // log("User: ", user);
  return user && _.any(votes, vote => (vote.userId == user._id && vote.voteType == "upvote"));
};

// TODO: Remove this function.
// const voteFn = (that, votes, user, document) => {
//   // log("executing voteFn", "user", user, "document", _.isObject(document) ? _.keys(document) : null);
//   const voteExists = _.filter(votes, (vote) => vote.userId == user._id && vote.documentId == document._id).length;
//   const fn = voteExists ? that.props.updateVote : that.props.newVote;
//   return fn;
// };

export { hasUpvoted, hasDownvoted, hasUpvotedNew, hasDownvotedNew, voteFn, log }
