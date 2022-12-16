import ReviewVotes from "./collections/reviewVotes/collection"
import Users from "./collections/users/collection"
import { getCostData, REVIEW_YEAR } from "./reviewUtils"
import groupBy from 'lodash/groupBy';
import { Posts } from '../lib/collections/posts';
import { Dictionary } from "lodash";

const getCost = (vote: reviewVoteFragment) => {
  return getCostData({})[vote.qualitativeScore].cost
} 
const getValue = (vote: reviewVoteFragment, total: number) => {
  return getCostData({costTotal:total})[vote.qualitativeScore].value
}

function updatePost(postList, vote, total: number) {
  if (postList[vote.postId] === undefined) { 
    postList[vote.postId] = [getValue(vote, total)]
  } else {
    postList[vote.postId].push(getValue(vote, total))
  }
}

// takes a user's reviewVotes and updates the list of posts to include
async function updatePreliminaryVoteTotals(usersByUserId: Dictionary<DbUser[]>, votesByUserId: Dictionary<DbReviewVote[]>) {
  let postsAllUsers = {}
  let postsHighKarmaUsers = {}
  let postsAFUsers = {}

  for (let userId of Object.keys(votesByUserId)) {
    let totalUserPoints = 0 
    // eslint-disable-next-line no-console
    console.log(userId)
    const user = usersByUserId[userId][0]
    const userVotes = votesByUserId[userId]
      // only used after final voting phase.
      //.filter(vote => postIds.includes(vote.postId)) 

    const costTotal = userVotes.reduce((total,vote) => total + getCost(vote), 0)
    // eslint-disable-next-line no-console
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

  for (let postId in postsAllUsers) {
    const reviewVoteScoreAllKarma = postsAllUsers[postId].reduce((x, y) => x + y, 0) 
    const reviewVotesAllKarma = postsAllUsers[postId].sort((a,b) => b - a)
    // console.log({postId, reviewVoteScoreAllKarma, reviewVotesAllKarma})
    await Posts.rawUpdateOne({_id:postId}, {$set: { 
      reviewVotesAllKarma,
      reviewVoteScoreAllKarma 
    }})
  }
  for (let postId in postsHighKarmaUsers) {
    const reviewVoteScoreHighKarma = postsHighKarmaUsers[postId].reduce((x, y) => x + y, 0)
    const reviewVotesHighKarma = postsHighKarmaUsers[postId].sort((a,b) => b - a)
    // console.log({postId, reviewVoteScoreHighKarma, reviewVotesHighKarma})
    await Posts.rawUpdateOne({_id:postId}, {$set: { 
      reviewVotesHighKarma,
      reviewVoteScoreHighKarma,
    }})
  }
  for (let postId in postsAFUsers) {
    const reviewVoteScoreAF =  postsAFUsers[postId].reduce((x, y) => x + y, 0)
    const reviewVotesAF =  postsAFUsers[postId].sort((a,b) => b - a)
    // console.log({postId, reviewVoteScoreAF, reviewVotesAF})
    await Posts.rawUpdateOne({_id:postId}, {$set: { 
      reviewVotesAF,
      reviewVoteScoreAF,
     }})
  }
} 

export async function updateReviewVoteTotals (phase) {
  const votes = await ReviewVotes.find({year: REVIEW_YEAR+""}).fetch()

  // we group each user's votes, so we can weight them appropriately
  // based on the user's vote cost total. 
  // 
  // also organizers them by userId to make them easier to grab later
  const votesByUserId = groupBy(votes, vote => vote.userId)

  // fetch all users who have cast one or more votes
  const users = await Users.find({_id: {$in: Object.keys(votesByUserId)}}).fetch()

  // organizes users by userId to make them easy to grab later.
  const usersByUserId = groupBy(users, user => user._id)

  if (phase === "nominationVote") {
    await updatePreliminaryVoteTotals(usersByUserId, votesByUserId)
  }
  if (phase === "finalVote") {
    // Only used during final voting phase
    // const posts = await Posts.find({reviewCount: {$gte: 1}}).fetch()
    // const postIds = posts.map(post=>post._id)
  }
}
