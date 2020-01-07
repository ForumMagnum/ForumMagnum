import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment reviewVoteFragment on ReviewVote {
    _id
    createdAt
    userId
    postId
    qualitativeScore
    quadraticScore
    comment
  }
`)
