import ReviewVotes from "../server/collections/reviewVotes/collection"
import Users from "../server/collections/users/collection"
import { getCostData, REVIEW_YEAR, ReviewWinnerCategory } from "../lib/reviewUtils"
import groupBy from 'lodash/groupBy';
import { Posts } from '../server/collections/posts/collection';
import { postGetPageUrl } from "../lib/collections/posts/helpers";
import moment from "moment";
import { userBigVotePower } from "@/lib/voting/voteTypes";
import ReviewWinners from "@/server/collections/reviewWinners/collection";
import { Tags } from "@/server/collections/tags/collection";
import { createAdminContext } from "./vulcan-lib/createContexts";
import { createMutator } from "./vulcan-lib/mutators";

export interface Dictionary<T> {
  [index: string]: T;
}

const getCost = (vote: DbReviewVote): number => {
  return getCostData({})[vote.qualitativeScore].cost
} 
const getValue = (vote: DbReviewVote, total: number): number|null => {
  return getCostData({costTotal:total})[vote.qualitativeScore].value
}

function updatePost(postList: Record<string,Array<number>>, vote: DbReviewVote, total: number, user?: DbUser) {
  const value = getValue(vote, total)
  if (value === null) return
  const votePower = user ? userBigVotePower(user.karma ?? 0, 1) : 1
  const finalValue = value * votePower
  if (postList[vote.postId] === undefined) {
    postList[vote.postId] = [finalValue]
  } else {
    postList[vote.postId].push(finalValue)
  }
}

type reviewVotePhase = 'nominationVote'|'finalVote'

// takes a user's reviewVotes and updates the list of posts to include the vote totals,
// weighting 
async function updateVoteTotals(usersByUserId: Dictionary<DbUser[]>, votesByUserId: Dictionary<DbReviewVote[]>, votePhase: reviewVotePhase, postIds: Array<string>) {
  let postsAllUsers: Record<string,Array<number>> = {}
  let postsHighKarmaUsers: Record<string,Array<number>> = {}

  for (let userId of Object.keys(votesByUserId)) {
    const user = usersByUserId[userId][0]
    
    const userVotes = votesByUserId[userId]
    const filteredUserVotes = votePhase === 'finalVote' ? userVotes.filter(vote => postIds.includes(vote.postId)) : userVotes

    const costTotal = filteredUserVotes.reduce((total,vote) => total + getCost(vote), 0)
    for (let vote of votesByUserId[userId]) {
      if (!vote.qualitativeScore) continue
            
      // store the non-multiplied vote values on the finalReviewVotesAllKarma
      updatePost(postsAllUsers, vote, costTotal)

      // store the strong-vote multiplied vote values on the finalReviewVotesHighKarma
      updatePost(postsHighKarmaUsers, vote, costTotal, user)
    }
  }

  for (let postId in postsAllUsers) {
    // eslint-disable-next-line no-console
    console.log("Updating vote totals for All Users", postId)
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
    console.log("Updating vote totals for High Karma Users", postId )
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
  // eslint-disable-next-line no-console
  console.log("finished updating review vote toals")
} 

// Exported to allow running manually with "yarn repl"
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
        flex-wrap:wrap;
        width:350px;
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
    const score1 = post1.finalReviewVoteScoreHighKarma
    const score2 = post2.finalReviewVoteScoreHighKarma
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

  return `<div><div class="votingResultsPost">
    ${style}
    <table>
      ${postsHtml}
    </table>
  </div></div>`
}

//
// Once you've run the migration, you should copy the results into a spreadsheet for easier analysis, and for posterity.
// 

// MAKE SURE TO UPDATE LIMIT OF QUERY IN UI

// SELECT 
//   title,
//   _id,
//   "userId",
//   author,
//   af,
//   "reviewCount",
//   "finalReviewVotesHighKarma",
//   "finalReviewVoteScoreAllKarma",
//   "finalReviewVoteScoreHighKarma",
//   "positiveReviewVoteCount",
//   "finalReviewVotesAllKarma"
// FROM "Posts"
// WHERE 
//   "postedAt" >= '2023-01-01' 
//   AND "postedAt" < '2024-01-01'
//   AND "positiveReviewVoteCount" > 0
// ORDER BY "reviewVoteScoreHighKarma" DESC

// SELECT 
//   title,
//   _id,
//   "userId",
//   author,
//   af,
//   "reviewCount",
//   "reviewVotesHighKarma",
//   "reviewVoteScoreAllKarma",
//   "reviewVoteScoreHighKarma",
//   "positiveReviewVoteCount",
//   "reviewVotesAllKarma",
//   "reviewVotesAF",
//   "reviewVoteScoreAF"
// FROM "Posts"
// WHERE 
//   "postedAt" >= '2023-01-01' 
//   AND "postedAt" < '2024-01-01'
//   AND "positiveReviewVoteCount" > 0
// ORDER BY "reviewVoteScoreHighKarma" DESC


// This fetches the tags used to assign posts to a ReviewWinnerCategory, which 
// almost-but-not-exactly map to Core Tags.
const fetchCategoryAssignmentTags = async () => {
  const [coreTags, aiStrategyTags] = await Promise.all([
    Tags.find({core: true, name: {$in: ["Rationality", "World Modeling", "World Optimization", "Practical", "AI"]}}).fetch(),
    Tags.find({name: {$in: ["AI Governance", "AI Timelines", "AI Takeoff", "AI Risk"]}}).fetch()
  ])
  return {coreTags, aiStrategyTags}
}

const tagToCategory: Record<string,ReviewWinnerCategory> = {
  "Rationality": "rationality",
  "World Modeling": "modeling",
  "World Optimization": "optimization",
  "Practical": "practical"
}

// ReviewWinnerCatogories don't include "Community", and split AI into two major categories: 
// Technical AI Safety ("ai safety") and AI Strategy. This function uses some heuristics to 
// guess which category a post belongs to. 
const getPostCategory = (post: DbPost, coreTags: DbTag[], aiStrategyTags: DbTag[]) => {
  const tagRelevance = post.tagRelevance
  const coreTagsOnPost = coreTags.filter(tag => tagRelevance[tag._id] > 0)
  const postHasAIStrategyTag = aiStrategyTags.some(tag => tagRelevance[tag._id] > 0)
  const mostRelevantCoreTag = coreTagsOnPost.sort((a,b) => tagRelevance[b._id] - tagRelevance[a._id])[0]
  if (mostRelevantCoreTag?.name === "AI") {
    return postHasAIStrategyTag ? "ai strategy" : "ai safety"
  } else {
    return tagToCategory[mostRelevantCoreTag?.name]
  }
}

const getReviewWinnerPosts = async () => {
  return await Posts.find({
    postedAt: {
      $gte:moment(`${REVIEW_YEAR}-01-01`).toDate(), 
      $lt:moment(`${REVIEW_YEAR+1}-01-01`).toDate()
    }, 
    finalReviewVoteScoreAllKarma: {$gte: 1},
    reviewCount: {$gte: 1},
    positiveReviewVoteCount: {$gte: 1}
  }, {sort: {finalReviewVoteScoreHighKarma: -1}, limit: 51}).fetch()
}

export const createReviewWinnerFromId = async (postId: string, idx: number, category: ReviewWinnerCategory) => {
  const post = await Posts.findOne({_id: postId})
  if (!post) {
    throw new Error(`Post not found: ${postId}`)
  }
  const adminContext = createAdminContext();
  return createReviewWinner(post, idx, category, adminContext)
}

const createReviewWinner = async (post: DbPost, idx: number, category: ReviewWinnerCategory, adminContext: ResolverContext) => { 
  return createMutator({
    collection: ReviewWinners,
    document: {
      postId: post._id,
      reviewYear: REVIEW_YEAR,    
      reviewRanking: idx,
      category,
    },
    context: adminContext,
    currentUser: adminContext.currentUser,
    validate: false
  })
}

// This is for manually checking what the default assignments for post categories are, 
// to sanity check that they make sense before running the final "createReviewWinners" script
// Exported to allow running manually with "yarn repl"
export const checkReviewWinners = async () => {
  const posts = await getReviewWinnerPosts()
  const {coreTags, aiStrategyTags} = await fetchCategoryAssignmentTags()

  posts.forEach((post, idx) => {
    const category = getPostCategory(post, coreTags, aiStrategyTags)
    // eslint-disable-next-line no-console
    console.log(idx, `${post.title} (${category})`, post.finalReviewVoteScoreHighKarma)
  })
}

export const createReviewWinners = async () => {
  const posts = await getReviewWinnerPosts()
  const {coreTags, aiStrategyTags} = await fetchCategoryAssignmentTags()
  const adminContext = createAdminContext();

  await Promise.all(posts.map((post, idx) => {
    const category = getPostCategory(post, coreTags, aiStrategyTags)
    return createReviewWinner(post, idx, category, adminContext)
  }))
}

// If you made any mistakes with the rank-order of the ReviewWinners (i.e. because you decided
// to remove a post from the list), run this function to fix the rank orders.
//
// This is necessary because the reviewRanking has enforced uniqueness for rank+year, and
// you can't edit an individual
//
// (This is similar but not identical to the updateCuratedOrder function in ReviewWinnersRepo,
// which handles a similar case for the curatedOrder field, although only one post at a time)
export const updateReviewWinnerRankings = async (year: number) => {
  
  const reviewWinners = await ReviewWinners.find({reviewYear: year}).fetch()
  const postIds = reviewWinners.map(winner => winner.postId)
  const posts = await Posts.find({ _id: { $in: postIds } }).fetch()

  const postsById = Object.fromEntries(posts.map(post => [post._id, post]))

  const sortedWinners = [...reviewWinners].sort((a, b) => {
    const scoreA = postsById[a.postId]?.finalReviewVoteScoreHighKarma ?? 0;
    const scoreB = postsById[b.postId]?.finalReviewVoteScoreHighKarma ?? 0;
    return scoreB - scoreA; // Sort descending
  });

  // 4. Set temporary rankings in parallel
  // (to avoid errors from the enforced uniqueness)
  const tempRankStart = -10000;
  await Promise.all(
    sortedWinners.map((winner, i) => 
      ReviewWinners.rawUpdateOne(
        {_id: winner._id},
        {$set: {reviewRanking: tempRankStart - i}}
      )
    )
  );

  sortedWinners.map((winner, i) => ReviewWinners.rawUpdateOne(
      {_id: winner._id},
      {$set: {reviewRanking: i}}
    )
  )
};
