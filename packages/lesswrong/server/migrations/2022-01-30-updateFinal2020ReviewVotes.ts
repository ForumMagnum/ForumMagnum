import { registerMigration } from './migrationUtils';
import ReviewVotes from '../../lib/collections/reviewVotes/collection';
import { getCostData, REVIEW_YEAR } from '../../lib/reviewUtils';
import groupBy from 'lodash/groupBy';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';


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

const getCost = (vote) => getCostData({})[vote.qualitativeScore].cost
const getValue = (vote, total) => getCostData({costTotal:total})[vote.qualitativeScore].value

// TODO: Write a better version of this migration which properly normalizes vote strength
registerMigration({
  name: "updateFinal2020ReviewVotes",
  dateWritten: "2022-01-30",
  idempotent: true,
  action: async () => {
    const votes = await ReviewVotes.find({year: REVIEW_YEAR+""}).fetch()
    
    const votesByUserId = groupBy(votes, vote => vote.userId)
    const users = await Users.find({_id: {$in: Object.keys(votesByUserId)}}).fetch()
    const usersByUserId = groupBy(users, user => user._id)

    let postsAllUsers = {}
    let postsHighKarmaUsers = {}
    let postsAFUsers = {}

    const posts = await Posts.find({reviewCount: {$gte: 1}}).fetch()
    const postIds = posts.map(post=>post._id)

    function updatePost(postList, vote, total) {
      if (postList[vote.postId] === undefined) { 
        postList[vote.postId] = [getValue(vote, total)]
      } else {
        postList[vote.postId].push(getValue(vote, total))
      }
    }

    for (let userId in votesByUserId) {
      let totalUserPoints = 0 
      console.log(userId)
      const user = usersByUserId[userId][0]
      const votes = votesByUserId[userId].filter(vote => postIds.includes(vote.postId))

      const costTotal = votes.reduce((total,vote) => total + getCost(vote), 0)
      console.log(userId, costTotal, (costTotal > 500) ? "500+" : "")
      for (let vote of votesByUserId[userId]) {
        if (!vote.qualitativeScore) continue
                
        updatePost(postsAllUsers, vote, costTotal)

        if (user.karma >= 1000) {
          updatePost(postsHighKarmaUsers, vote, costTotal)
        }
        
        if (user.groups?.includes('alignmentForum')) {
          updatePost(postsAFUsers, vote, costTotal)
        }
      }
    }

    const finalPosts = Object.entries(postsHighKarmaUsers).map(post => [post[0], [post[1].reduce(x,y => x+7, 0)]])
    // console.log(postsHighKarmaUsers.map(post=>)

    // const finalPosts = groupBy(postsHighKarmaUsers, post => post.userId)

    let html = "" 



    // for (let postId in postsAllUsers) {
    //   await Posts.update({_id:postId}, {$set: { 
    //     finalReviewVotesAllKarma: postsAllUsers[postId].sort((a,b) => b - a), 
    //     finalReviewVoteScoreAllKarma: postsAllUsers[postId].reduce((x, y) => x + y, 0) 
    //   }})
    // }
    // for (let postId in postsHighKarmaUsers) {
    //   await Posts.update({_id:postId}, {$set: { 
    //     finalReviewVotesHighKarma: postsHighKarmaUsers[postId].sort((a,b) => b - a),
    //     finalReviewVoteScoreHighKarma: postsHighKarmaUsers[postId].reduce((x, y) => x + y, 0),
    //   }})
    // }
    // for (let postId in postsAFUsers) {
    //   await Posts.update({_id:postId}, {$set: { 
    //     finalReviewVotesAF: postsAFUsers[postId].sort((a,b) => b - a),
    //     finalReviewVoteScoreAF: postsAFUsers[postId].reduce((x, y) => x + y, 0),
    //    }})
    // }
  },
});
