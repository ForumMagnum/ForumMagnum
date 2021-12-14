import { forEachBucketRangeInCollection, registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';
import ReviewVotes from '../../lib/collections/reviewVotes/collection';
import { REVIEW_YEAR } from '../../lib/reviewUtils';
import groupBy from 'lodash/groupBy';
import { Posts } from '../../lib/collections/posts';


const voteMap = {
  1: { 
    cost: 45,
    value: -9 
  },
  2: { 
    cost: 10,
    value: -4 
  },
  3: { 
    cost: 1,
    value: -1 
  },
  4: { 
    cost: 0,
    value: 0 
  },
  5: { 
    cost: 1,
    value: 1 
  },
  6: { 
    cost: 10,
    value: 4 
  },
  7: { 
    cost: 45,
    value: 9 
  },
}

const getCost = (vote) => voteMap[vote.qualitativeScore].cost
const getValue = (vote) => voteMap[vote.qualitativeScore].value

registerMigration({
  name: "updateQuadraticVotes",
  dateWritten: "2021-12-02",
  idempotent: true,
  action: async () => {
    const votes = await ReviewVotes.find({year: REVIEW_YEAR+""}).fetch()
    const votesByUserId = groupBy(votes, vote => vote.userId)
    let posts = {}
    Object.keys(votesByUserId).forEach((userId) => {
      let totalUserPoints = 0 
      votesByUserId[userId].forEach(vote => {
        totalUserPoints += getCost(vote)
        ReviewVotes.update({_id:vote._id}, {$set: {quadraticVote: getValue(vote)}})
        const currentPostScore = posts[vote.postId]
        if (currentPostScore === undefined) { 
          posts[vote.postId] = getValue(vote)
        } else {
          posts[vote.postId] = posts[vote.postId] + getValue(vote)
        }
      })
      // eslint-disable-next-line no-console
      if (totalUserPoints > 500) console.log(userId, totalUserPoints)
    })
    Object.keys(posts).forEach(postId => {
      Posts.update({_id:postId}, {$set: { reviewVoteScore: posts[postId] }})
    })
  },
});
