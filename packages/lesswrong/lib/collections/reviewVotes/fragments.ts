import { registerFragment } from '../../vulcan-lib';

registerFragment(`
  fragment reviewVoteFragment on ReviewVote {
    _id
    createdAt
    userId
    postId
    qualitativeScore
    quadraticScore
    comment
    year
    dummy
    reactions
  }
`)


registerFragment(`
  fragment reviewVoteWithUser on ReviewVote {
    ...reviewVoteFragment
    user {
      ...UsersMinimumInfo
    }
  }
`)
