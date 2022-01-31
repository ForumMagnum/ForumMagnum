import { registerMigration } from './migrationUtils';
import ReviewVotes from '../../lib/collections/reviewVotes/collection';
import { getCostData, REVIEW_YEAR } from '../../lib/reviewUtils';
import groupBy from 'lodash/groupBy';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';

const getCost = (vote) => getCostData({})[vote.qualitativeScore].cost
const getValue = (vote, total) => getCostData({costTotal:total})[vote.qualitativeScore].value

registerMigration({
  name: "updateFinal2020ReviewVotes",
  dateWritten: "2022-01-30",
  idempotent: true,
  action: async () => {
    // const votes = await ReviewVotes.find({year: REVIEW_YEAR+""}).fetch()
    
    // const votesByUserId = groupBy(votes, vote => vote.userId)
    // const users = await Users.find({_id: {$in: Object.keys(votesByUserId)}}).fetch()
    // const usersByUserId = groupBy(users, user => user._id)

    // let postsAllUsers = {}
    // let postsHighKarmaUsers = {}
    // let postsAFUsers = {}

    // const posts = await Posts.find({reviewCount: {$gte: 1}}).fetch()
    // const postIds = posts.map(post=>post._id)

    // function updatePost(postList, vote, total) {
    //   if (postList[vote.postId] === undefined) { 
    //     postList[vote.postId] = [getValue(vote, total)]
    //   } else {
    //     postList[vote.postId].push(getValue(vote, total))
    //   }
    // }

    // for (let userId in votesByUserId) {
    //   let totalUserPoints = 0 
    //   console.log(userId)
    //   const user = usersByUserId[userId][0]
    //   const votes = votesByUserId[userId].filter(vote => postIds.includes(vote.postId))

    //   const costTotal = votes.reduce((total,vote) => total + getCost(vote), 0)
    //   console.log(userId, costTotal, (costTotal > 500) ? "500+" : "")
    //   for (let vote of votesByUserId[userId]) {
    //     if (!vote.qualitativeScore) continue
                
    //     updatePost(postsAllUsers, vote, costTotal)

    //     if (user.karma >= 1000) {
    //       updatePost(postsHighKarmaUsers, vote, costTotal)
    //     }
        
    //     if (user.groups?.includes('alignmentForum')) {
    //       updatePost(postsAFUsers, vote, costTotal)
    //     }
    //   }
    // }

    // console.log("Updating all karma...")
    // for (let postId in postsAllUsers) {
    //   await Posts.update({_id:postId}, {$set: { 
    //     finalReviewVotesAllKarma: postsAllUsers[postId].sort((a,b) => b - a), 
    //     finalReviewVoteScoreAllKarma: postsAllUsers[postId].reduce((x, y) => x + y, 0) 
    //   }})
    // }

    // console.log("Updating high karma...")
    // for (let postId in postsHighKarmaUsers) {
    //   await Posts.update({_id:postId}, {$set: { 
    //     finalReviewVotesHighKarma: postsHighKarmaUsers[postId].sort((a,b) => b - a),
    //     finalReviewVoteScoreHighKarma: postsHighKarmaUsers[postId].reduce((x, y) => x + y, 0),
    //   }})
    // }

    // console.log("Updating AF...")
    // for (let postId in postsAFUsers) {
    //   await Posts.update({_id:postId}, {$set: { 
    //     finalReviewVotesAF: postsAFUsers[postId].sort((a,b) => b - a),
    //     finalReviewVoteScoreAF: postsAFUsers[postId].reduce((x, y) => x + y, 0),
    //    }})
    // }

    const finalPosts = await Posts.find({reviewCount: {$gt: 0}, finalReviewVoteScoreHighKarma: {$exists: true}}, {sort: {finalReviewVoteScoreHighKarma: -1}}).fetch()

    const authorIds = finalPosts.map(post => post.userId)

    const authors = await Users.find({_id: {$in:authorIds}}).fetch() 

    const getAuthor = post => {
      return authors.filter(author => author._id === post.userId)[0].displayName
    }

    const primaryColor = "#5f9b65" // ea-forum-look-here
    const errorColor = "#bf360c"

    const voteColor = vote => {
      if (vote > 0) return primaryColor  
      if (vote < 0) return errorColor
      return "#888"
    }

    const voteSize = vote => {
      const size = Math.sqrt(Math.abs(vote))*3
      return size < 3 ? 3 : size
    }

    const voteDot = (vote) => { 
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

    const donateButton = (post) => `<form action="https://www.paypal.com/cgi-bin/webscr" method="post" target="_blank" style="text-align: center">
    <input type="hidden" name="cmd" value="_s-xclick" />
    <input type="hidden" name="item_name" value='For ${getAuthor(post)}, author of "${post.title}" (NOT TAX DEDUCTIBLE)' />
    <input type="hidden" name="hosted_button_id" value="ZMFZULZHMAM9Y" />
    <input type="submit" value="Donate" border="0" name="submit" title="Donate to author ${getAuthor(post)} via PayPal" alt="Donate with PayPal button" class="donate-button"/>
    <img alt="" border="0" src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
    </form>`

    const postTableRow = (post, i) => `<tr>
        <td class="item-count">${i}</td>
        <td>
          <div class="title-row">
            <div class="title">
              <a href="/posts/${post._id}/${post.slug}"><b>${post.title}</b></a>
            </div>
            <div class="dots-row">
              ${post.finalReviewVotesHighKarma.sort((x,y) => x - y).map(vote=>voteDot(vote)).join("")}
            </div>
          </div>
        </td>
        <td>${donateButton(post)}</td>
      </tr>`

    const postTop15 = (post, i) =>  {
      if (!post) return null
      if (i > 14) return null 

      return `<li>
        <a href="/posts/${post._id}/${post.slug}">
          <b>${post.title}</b>
        </a> by ${getAuthor(post)}.
      </li>
      `
    }
    
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
          }
          .dot {
            margin-right:3px;
            border-radius:50%;
            display:inline-block;
          }
          .dots-row {
            display:flex;
            align-items:center;
            margin-left:15px;
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
        </style>
        <ol>
          ${finalPosts.map((post, i) => postTop15(post, i)).join("")}
        </ol>
        <table>
          ${finalPosts.map((post, i) => postTableRow(post, i)).join("")}
        </table>
      </div>`
    console.log(html)
  },
});
