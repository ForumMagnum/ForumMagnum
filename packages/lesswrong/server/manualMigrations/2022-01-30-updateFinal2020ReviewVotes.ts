import { registerMigration } from './migrationUtils';
import ReviewVotes from '../../server/collections/reviewVotes/collection';
import { getCostData, REVIEW_YEAR } from '../../lib/reviewUtils';
import groupBy from 'lodash/groupBy';
import { Posts } from '../../server/collections/posts/collection';
import Users from '../../server/collections/users/collection';
import moment from 'moment';
import { getForumTheme } from '../../themes/forumTheme';
import { isLW } from '../../lib/instanceSettings';
import fs from 'fs';

const getCost = (vote: AnyBecauseTodo) => getCostData({})[vote.qualitativeScore].cost
const getValue = (vote: AnyBecauseTodo, total: number) => getCostData({costTotal:total})[vote.qualitativeScore].value

export default registerMigration({
  name: "updateFinal2020ReviewVotes",
  dateWritten: "2022-01-30",
  idempotent: true,
  action: async () => {
    const votes = await ReviewVotes.find({year: REVIEW_YEAR+""}).fetch()
    
    const votesByUserId = groupBy(votes, vote => vote.userId)
    const users = await Users.find({_id: {$in: Object.keys(votesByUserId)}}).fetch()
    const usersByUserId = groupBy(users, user => user._id)

    let postsAllUsers: AnyBecauseObsolete = {}
    let postsHighKarmaUsers: AnyBecauseObsolete = {}
    let postsAFUsers: AnyBecauseObsolete = {}

    const posts = await Posts.find({reviewCount: {$gte: 1}}).fetch()
    const postIds = posts.map(post=>post._id)

    function updatePost(postList: AnyBecauseTodo, vote: AnyBecauseTodo, total: number) {
      if (postList[vote.postId] === undefined) { 
        postList[vote.postId] = [getValue(vote, total)]
      } else {
        postList[vote.postId].push(getValue(vote, total))
      }
    }

    for (let userId in votesByUserId) {
      let totalUserPoints = 0 
      // eslint-disable-next-line no-console
      console.log(userId)
      const user = usersByUserId[userId][0]
      const votes = votesByUserId[userId].filter(vote => postIds.includes(vote.postId))

      const costTotal = votes.reduce((total,vote) => total + getCost(vote), 0)
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

    // eslint-disable-next-line no-console
    console.log("Updating all karma...")
    for (let postId in postsAllUsers) {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        finalReviewVotesAllKarma: postsAllUsers[postId].sort((a: number, b: number) => b - a), 
        finalReviewVoteScoreAllKarma: postsAllUsers[postId].reduce((x: number, y: number) => x + y, 0) 
      }})
    }

    // eslint-disable-next-line no-console
    console.log("Updating high karma...")
    for (let postId in postsHighKarmaUsers) {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        finalReviewVotesHighKarma: postsHighKarmaUsers[postId].sort((a: number,b: number) => b - a),
        finalReviewVoteScoreHighKarma: postsHighKarmaUsers[postId].reduce((x: number, y: number) => x + y, 0),
      }})
    }
    // eslint-disable-next-line no-console
    console.log("Updating AF...")
    for (let postId in postsAFUsers) {
      await Posts.rawUpdateOne({_id:postId}, {$set: { 
        finalReviewVotesAF: postsAFUsers[postId].sort((a: number,b: number) => b - a),
        finalReviewVoteScoreAF: postsAFUsers[postId].reduce((x: number, y: number) => x + y, 0),
       }})
    }

    const finalPosts: DbPost[] = isLW() ?
      await Posts.find({
        reviewCount: {$gt: 0},
        finalReviewVoteScoreHighKarma: {$exists: true},
        postedAt: {$gte: moment(`${REVIEW_YEAR}-01-01`).toDate()}
      }, {sort: {finalReviewVoteScoreHighKarma: -1}}).fetch() :
      await Posts.aggregate([
        {$match: {reviewCount: {$gt: 0}, finalReviewVoteScoreHighKarma: {$exists: true}}},
        {$project: {
          _id : 1,
          slug : 1,
          title : 1,
          userId : 1,
          finalReviewVotesHighKarma: 1,
          finalReviewVoteScore: 1,
          finalReviewVoteScoreHighKarma: 1,
          finalReviewVoteScoreAllKarma: 1,
          combinedScore : {
            $sum : [
              {$multiply: ['$finalReviewVoteScoreHighKarma', 2]},
              '$finalReviewVoteScoreAllKarma',
            ]
          }
        }},
        {$sort : {combinedScore : -1}},
      ]).toArray()
    
    const authorIds = finalPosts.map(post => post.userId)

    const authors = await Users.find({_id: {$in:authorIds}}).fetch()

    const getAuthor = (post: DbPost) => authors.filter(author => author._id === post.userId)[0]

    const theme = getForumTheme({name: "default", siteThemeOverride: {}});
    const primaryColor = theme.palette.primary.main;
    const errorColor = "#bf360c"

    const voteColor = (vote: AnyBecauseObsolete) => {
      if (vote > 0) return primaryColor  
      if (vote < 0) return errorColor
      return "#888"
    }

    const voteSize = (vote: AnyBecauseObsolete) => {
      const size = Math.sqrt(Math.abs(vote))*3
      return size < 3 ? 3 : size
    }

    const voteDot = (vote: AnyBecauseObsolete) => {
      if (vote !== 0) {
        return `<span title="${vote}" class="dot" style="
          height:${voteSize(vote)}px;
          width:${voteSize(vote)}px;
          opacity:${vote > 4 ? 1 : .6};
          background-color:${voteColor(vote)};
        ">
        </span>`
      }
    }

    const donateButton = (post: DbPost) => isLW() ? `<td><form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style="text-align: center">
    <input type="hidden" name="cmd" value="_s-xclick" />
    <input type="hidden" name="item_name" value='Best of LessWrong Prize, with special appreciation for ${getAuthor(post).displayName}, author of "${post.title}".' />
    <input type="hidden" name="hosted_button_id" value="ZMFZULZHMAM9Y" />
    <input type="submit" value="Donate" border="0" name="submit" title="Donate via PayPal" alt="Donate with PayPal button" class="donate-button"/>
    <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
    </form></td>` : ""

    const postTableRow = (post: DbPost, i: number) => `<tr>
        <td class="item-count">${i}</td>
        <td>
          <div class="title-row">
            <div class="title">
              <span class="post-title">
                <a href="/posts/${post._id}/${post.slug}">${post.title}</a>
              </span>
              <span class="author">
                <a href="/users/${getAuthor(post).slug}">${getAuthor(post).displayName}</a>
              </span>

            </div>
            <div class="dots-row">
              ${(post.finalReviewVotesHighKarma || []).sort((x,y) => x - y).map(vote=>voteDot(vote)).join("")}
            </div>
          </div>
        </td>
        ${donateButton(post)}
      </tr>`
    
    const html = `<div>
        <style>
          .item-count {
            white-space:pre;
            text-align:center;
            font-size:12px;
            font-family: sans-serif;
            color: #999
          }
          td {
            border:none !important;
          }
          table {
            border:none !important;
          }
          tr {
            border-bottom: solid 1px rgba(0,0,0,.2);
          }
          .title {
            max-width: 350px;
            line-height:1rem
          }
          .dot {
            margin-right:3px;
            border-radius:50%;
            display:inline-block;
          }
          .dots-row {
            display:flex;
            align-items:center;
            margin-left:auto;
            padding-top:8px;
            padding-bottom:8px;
          }
          .donate-button {
            background:${primaryColor}; 
            opacity:.8; 
            color:white; 
            font-weight:600; 
            border-radius:6px; 
            padding:8px; 
            font-size:12px; 
            cursor: pointer;
          }
          .title-row {
            display:flex;
            justify-content:space-between;
            flex-wrap:wrap;
          }
          .author a  {
            font-size: 14px;
            white-space: pre;
            line-height: 1rem;
          }
          .post-title a {
            font-weight:600;
            line-height:2rem;
          }
        </style>
        <table>
          ${finalPosts.map((post, i) => postTableRow(post, i)).join("")}
        </table>
      </div>`

    fs.writeFileSync('review-vote-table.html', html)
  },
});
