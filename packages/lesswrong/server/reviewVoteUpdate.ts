import ReviewVotes from "../lib/collections/reviewVotes/collection"
import Users from "../lib/collections/users/collection"
import { getCostData, REVIEW_YEAR } from "../lib/reviewUtils"
import groupBy from 'lodash/groupBy';
import { Posts } from '../lib/collections/posts';
import { postGetPageUrl } from "../lib/collections/posts/helpers";
import moment from "moment";
import { Globals } from "./vulcan-lib";

export interface Dictionary<T> {
  [index: string]: T;
}

const getCost = (vote: DbReviewVote): number => {
  return getCostData({})[vote.qualitativeScore].cost
} 
const getValue = (vote: DbReviewVote, total: number): number|null => {
  return getCostData({costTotal:total})[vote.qualitativeScore].value
}

function updatePost(postList: Record<string,Array<number>>, vote: DbReviewVote, total: number) {
  if (postList[vote.postId] === undefined) {
    postList[vote.postId] = [getValue(vote, total)!]
  } else {
    postList[vote.postId].push(getValue(vote, total)!)
  }
}

type reviewVotePhase = 'nominationVote'|'finalVote'

// takes a user's reviewVotes and updates the list of posts to include the vote totals,
// weighting 
async function updateVoteTotals(usersByUserId: Dictionary<DbUser[]>, votesByUserId: Dictionary<DbReviewVote[]>, votePhase: reviewVotePhase, postIds: Array<string>) {
  let postsAllUsers: Record<string,Array<number>> = {}
  let postsHighKarmaUsers: Record<string,Array<number>> = {}
  let postsAFUsers: Record<string,Array<number>> = {}

  for (let userId of Object.keys(votesByUserId)) {
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

Globals.updateReviewVoteTotals = updateReviewVoteTotals;

export async function createVotingPostHtml () {
  const style = `
    <style>
      .votingResultsPost .item-count {
        white-space: pre;
        text-align: center;
        font-size: 12px;
        font-family: sans-serif;
        color: #999
      }

      .votingResultsPost td {
        border: none !important;
      }

      .votingResultsPost table {
        border: none !important;
      }

      .votingResultsPost tr {
        border-bottom: solid 1px rgba(0, 0, 0, .2);
      }

      .votingResultsPost .title {
        max-width: 350px;
      }

      @media only screen and (min-width: 600px) .votingResultsPost td:nth(1) {
        background: red;
      }

      @media only screen and (min-width: 600px) .votingResultsPost td:nth(2) {
        width: 100%  
      }

      @media only screen and (min-width: 600px) .votingResultsPost td:nth(3) {
        background: blue;
      }

      .votingResultsPost .dot {
        margin-right: 2px;
        margin-bottom: 2px;
        border-radius: 50%;
        display: inline-block;
      }

      .votingResultsPost .dots-row {
        display:flex;
        align-items:center;
        justify-content: flex-end;
        margin-left:auto;
        padding-top:8px;
        padding-bottom:8px;
      }
      .votingResultsPost .post-author  {
        font-size: 14px;
        white-space: pre;
        line-height: 1rem;
        word-break:keep-all;
        color: rgba(0,0,0,.5);
      }
      
      .votingResultsPost .post-title a:hover {
        color: rgba(0,0,0,.87)
      }
      .votingResultsPost .post-title a {
        font-weight:500;
        color: rgba(0,0,0,.87);
        line-height:2rem;
      }
    </style>
  `

  
  // eslint-disable-next-line no-console
  console.log("Loading posts")
  const posts = await Posts.find({
    postedAt: {
      $gte:moment(`${REVIEW_YEAR}-01-01`).toDate(), 
      $lt:moment(`${REVIEW_YEAR+1}-01-01`).toDate()
    }, 
    finalReviewVoteScoreAllKarma: {$gte: 1},
    reviewCount: {$gte: 1},
    positiveReviewVoteCount: {$gte: 1}
  }).fetch()
  
  // we weight the high karma user's votes 3x higher than baseline
  posts.sort((post1, post2) => {
    const score1 = (post1.finalReviewVoteScoreHighKarma*2) + post1.finalReviewVoteScoreAllKarma
    const score2 = (post2.finalReviewVoteScoreHighKarma*2) + post2.finalReviewVoteScoreAllKarma
    return score2 - score1
  })

  const userIds = [...new Set(posts.map(post => post.userId))]
  
  // eslint=disable-next-line no-console
  const users = await Users.find({_id: {$in:userIds}}).fetch()

  const getDot = (vote: number) => {
    const size = Math.max(Math.abs(vote)*1.5, 3)
    const color = vote > 0 ? '#5f9b65' : '#bf360c'
    return `<span title='${vote}' class="dot" style="width:${size}px; height:${size}px; background:${color}"></span>`
  }
  const postsHtml = posts.map((post, i) => {
    return `<tr>
      <td class="item-count">${i}</td>
      <td>
        <a class="post-title" href="${postGetPageUrl(post)}">${post.title}</a>
        <span class="post-author">${users.filter(u => u._id === post.userId)[0]?.displayName}</span>
      </td>
      <td>
        <div class="dots-row">
          ${post.finalReviewVotesAllKarma.sort((v1, v2) => v2-v1).map(vote => getDot(vote)).join("")}
        </div>
      </td>
    </tr>`
  }).join("")

  return `<div class="votingResultsPost">
    ${style}
    <table>
      ${postsHtml}
    </table>
  </div>`
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

// MAKE SURE TO UPDATE LIMIT OF QUERY IN UI
