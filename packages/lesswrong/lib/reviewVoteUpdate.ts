import ReviewVotes from "./collections/reviewVotes/collection"
import Users from "./collections/users/collection"
import { getCostData, REVIEW_YEAR } from "./reviewUtils"
import groupBy from 'lodash/groupBy';
import { Posts } from '../lib/collections/posts';
// import Dictionary from "lodash/Dictionary";  //TODO figure out whether/how to import this

export interface Dictionary<T> {
  [index: string]: T;
}

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

type reviewVotePhase = 'nominationVote'|'finalVote'

// takes a user's reviewVotes and updates the list of posts to include the vote totals,
// weighting 
async function updateVoteTotals(usersByUserId: Dictionary<DbUser[]>, votesByUserId: Dictionary<DbReviewVote[]>, votePhase: reviewVotePhase, postIds: Array<string>) {
  let postsAllUsers = {}
  let postsHighKarmaUsers = {}
  let postsAFUsers = {}

  for (let userId of Object.keys(votesByUserId)) {
    let totalUserPoints = 0 
    // eslint-disable-next-line no-console
    console.log(userId)
    const user = usersByUserId[userId][0]
    
    const userVotes = votesByUserId[userId]
    const filteredUserVotes = votePhase === 'finalVote' ? userVotes.filter(vote => postIds.includes(vote.postId)) : userVotes

    const costTotal = filteredUserVotes.reduce((total,vote) => total + getCost(vote), 0)
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
    // eslint-disable-next-line no-console
    console.log("Updating vote totals for All Users")
    const reviewVoteScoreAllKarma = postsAllUsers[postId].reduce((x, y) => x + y, 0) 
    const reviewVotesAllKarma = postsAllUsers[postId].sort((a,b) => b - a)
    // console.log({postId, reviewVoteScoreAllKarma, reviewVotesAllKarma})

    if (votePhase === 'nominationVote') {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        reviewVotesAllKarma,
        reviewVoteScoreAllKarma 
      }})
    }
    if (votePhase === 'finalVote') {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        finalReviewVotesAllKarma: reviewVotesAllKarma,
        finalReviewVoteScoreAllKarma: reviewVoteScoreAllKarma
      }})
    }
  }
  for (let postId in postsHighKarmaUsers) {
    // eslint-disable-next-line no-console
    console.log("Updating vote totals for High Karma Users")
    const reviewVoteScoreHighKarma = postsHighKarmaUsers[postId].reduce((x, y) => x + y, 0)
    const reviewVotesHighKarma = postsHighKarmaUsers[postId].sort((a,b) => b - a)

    if (votePhase === 'nominationVote') {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        reviewVotesHighKarma,
        reviewVoteScoreHighKarma,
      }})
    }
    if (votePhase === 'finalVote') {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        finalReviewVotesHighKarma: reviewVotesHighKarma,
        finalReviewVoteScoreHighKarma: reviewVoteScoreHighKarma,
      }})
    }
  }
  for (let postId in postsAFUsers) {
    // eslint-disable-next-line no-console
    console.log("Updating vote totals for AF Users")
    const reviewVoteScoreAF =  postsAFUsers[postId].reduce((x, y) => x + y, 0)
    const reviewVotesAF =  postsAFUsers[postId].sort((a,b) => b - a)

    if (votePhase === 'nominationVote') {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        reviewVotesAF,
        reviewVoteScoreAF,
      }})
    }
    if (votePhase === 'finalVote') {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        finalReviewVotesAF: reviewVotesAF,
        finalReviewVoteScoreAF: reviewVoteScoreAF,
      }})
    }
  }
  // eslint-disable-next-line no-console
  console.log("finished updating review vote toals")
} 

export async function updateReviewVoteTotals (votePhase: reviewVotePhase) {
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

  if (votePhase === "nominationVote") {
    await updateVoteTotals(usersByUserId, votesByUserId, votePhase, [])
  }
  if (votePhase === "finalVote") {
    // Only used during final voting phase
    const posts = await Posts.find({reviewCount: {$gte: 1}}).fetch()
    const postIds = posts.map(post=>post._id)
    await updateVoteTotals(usersByUserId, votesByUserId, votePhase, postIds)
  }
}

//
// Once you've run the migration, you should copy the results into a spreadsheet for easier analysis, and for posterity.
// 

// This is the code to run in NosqlBooster or equivalent. 
// After running it, you may need to download the results as a csv and then
// import them into Google Sheets. (NosqlBooster doesn't have an easy copy-paste
// table option. Other tools might be fewer steps)

// db.posts.find({postedAt: {$gte:ISODate("2021-01-01"), $lt:ISODate("2022-01-01")}, positiveReviewVoteCount: {$gt:0}})
//   .projection({
//     title:1, 
//     _id:1, 
//     userId:1, 
//     author:1, 
//     af: 1,
//     reviewCount:1, 
//     positiveReviewVoteCount:1, 
//     reviewVotesAllKarma:1, 
//     reviewVoteScoreAllKarma:1, 
//     reviewVotesHighKarma:1, 
//     reviewVoteScoreHighKarma:1, 
//     reviewVotesAF:1, 
//     reviewVoteScoreAF:1
//   })
//   .sort({reviewVoteScoreAllKarma:-1})
