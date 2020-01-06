import { registerFragment } from 'meteor/vulcan:core';

registerFragment(`
  fragment reviewVoteFragment on ReviewVote {
    _id
    createdAt
    userId
    postId
    score
    type
    deleted
  }
`)
