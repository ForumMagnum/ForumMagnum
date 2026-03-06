/*
 * Generates the HTML for the "Voting Results for the XXXX Review" blog post.
 *
 * Run via:
 *   yarn repl prod packages/lesswrong/server/scripts/reviewGetResultsPost.ts 'getReviewPrizesPost()'
 */

import fs from 'fs';
import Users from "@/server/collections/users/collection";
import { Posts } from '@/server/collections/posts/collection';
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { REVIEW_YEAR } from "@/lib/reviewUtils";
import moment from "moment";

const votingResultsStyles = `
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
`;

function getDot(vote: number) {
  const size = Math.max(Math.abs(vote) * 1.5, 3);
  const color = vote > 0 ? '#5f9b65' : '#bf360c';
  return `<span title='${vote}' class="dot" style="width:${size}px; height:${size}px; background:${color}"></span>`;
}

async function createVotingPostHtml() {
  // eslint-disable-next-line no-console
  console.log("Loading posts");
  const posts = await Posts.find({
    postedAt: {
      $gte: moment(`${REVIEW_YEAR}-01-01`).toDate(),
      $lt: moment(`${REVIEW_YEAR + 1}-01-01`).toDate()
    },
    finalReviewVoteScoreAllKarma: {$gte: 1},
    reviewCount: {$gte: 1},
    positiveReviewVoteCount: {$gte: 1}
  }).fetch();

  posts.sort((a, b) => b.finalReviewVoteScoreHighKarma - a.finalReviewVoteScoreHighKarma);

  const userIds = [...new Set(posts.map(post => post.userId))];
  const users = await Users.find({_id: {$in: userIds}}).fetch();

  const postsHtml = posts.map((post, i) => {
    return `<tr>
      <td class="item-count">${i}</td>
      <td>
        <a class="post-title" href="${postGetPageUrl(post)}">${post.title}</a>
        <span class="post-author">${users.filter(u => u._id === post.userId)[0]?.displayName}</span>
      </td>
      <td>
        <div class="dots-row">
          ${post.finalReviewVotesAllKarma.sort((v1, v2) => v2 - v1).map(vote => getDot(vote)).join("")}
        </div>
      </td>
    </tr>`;
  }).join("");

  return `<div><div class="votingResultsPost">
    ${votingResultsStyles}
    <table>
      ${postsHtml}
    </table>
  </div></div>`;
}

// ── Useful SQL for exporting review results to a spreadsheet ─────────
//
// SELECT
//   title, _id, "userId", author, af, "reviewCount",
//   "finalReviewVotesHighKarma", "finalReviewVoteScoreAllKarma",
//   "finalReviewVoteScoreHighKarma", "positiveReviewVoteCount",
//   "finalReviewVotesAllKarma"
// FROM "Posts"
// WHERE "postedAt" >= '2024-01-01'
//   AND "postedAt" < '2025-01-01'
//   AND "positiveReviewVoteCount" > 0
// ORDER BY "finalReviewVoteScoreHighKarma" DESC

export const getReviewPrizesPost = async () => {
  const result = await createVotingPostHtml();
  fs.writeFile('reviewResultsPost.txt', result.toString(), err => {
    if (err) {
      // eslint-disable-next-line no-console
      console.error(err);
    }
  });
};
