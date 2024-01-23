import { addCronJob } from '../cronUtil';
import { Posts } from '../../lib/collections/posts';
import * as _ from 'underscore';
import { Comments } from '../../lib/collections/comments';
import { createAdminContext, createMutator } from '../vulcan-lib';
import { DatabaseServerSetting } from '../databaseSettings';
import { addOrUpvoteTag } from '../tagging/tagsGraphQL';
import Tags from "../../lib/collections/tags/collection";
import Users from "../../lib/collections/users/collection";


addCronJob({
  name: 'checkScheduledPosts',
  interval: 'every 10 minutes',
  async job() {
    // fetch all posts tagged as future
    const scheduledPosts = await Posts.find({isFuture: true}, {projection: {_id: 1, status: 1, postedAt: 1, userId: 1, title: 1}}).fetch();

    // filter the scheduled posts to retrieve only the one that should update, considering their schedule
    const postsToUpdate = scheduledPosts.filter(post => post.postedAt <= new Date());

    // update posts found
    if (!_.isEmpty(postsToUpdate)) {
      const postsIds = _.pluck(postsToUpdate, '_id');
      await Posts.rawUpdateMany({_id: {$in: postsIds}}, {$set: {isFuture: false}}, {multi: true});

      // log the action
      console.log('// Scheduled posts approved:', postsIds); // eslint-disable-line
    }
  }
});


const manifoldAPIKeySetting = new DatabaseServerSetting<string | null>('manifold.reviewBotKey', null)
const manifoldAPIKey = manifoldAPIKeySetting.get()

const reviewUserBotSetting = new DatabaseServerSetting<string | null>('reviewBotId', null)
const reviewUserBot = reviewUserBotSetting.get()

if (manifoldAPIKey === null) throw new Error("manifoldAPIKey is null")
if (reviewUserBot === null) throw new Error("reviewUserBot is null")

const makeComment = async (postId: string, year: number, marketUrl: string, botUser: DbUser | null) => {

  const commentString = `<p>The <a href="https://www.lesswrong.com/bestoflesswrong">LessWrong Review</a> runs every year to select the posts that have most stood the test of time. This post is not yet eligible for review, but will be at the end of ${year+1}. The top fifty or so posts are featured prominently on the site throughout the year. Will this post make the top 50?</p><figure class="media"><div data-oembed-url="${marketUrl}">
        <div class="manifold-preview">
          <iframe src=${marketUrl}>
        </iframe></div>
      </div></figure>
  `

  const createdComment = await createMutator({
    collection: Comments,
    document: {
      postId: postId,
      userId: reviewUserBot,
      contents: {originalContents: {
        type: "html",
        data: commentString
      }}
    },
    currentUser: botUser,
    context: createAdminContext()
  })

}

addCronJob({
  name: 'makeReviewManifoldMarket',
  interval: 'every 1 minute',
  async job() {

    async function pingSlackWebhook(webhookURL: string, data: any) {
      try {
        const response = await fetch(webhookURL, {
          method: 'POST',
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return response
      } catch (error) {
        //eslint-disable-next-line no-console
        console.error('There was a problem with the fetch operation: ', error);
      }
    }

    async function addTagToPost(postId: string, tagSlug: string, botUser: DbUser, context: ResolverContext) {
      const tag = await Tags.findOne({slug: tagSlug})
      if (!tag) throw new Error(`Tag with slug "${tagSlug}" not found`)
      await addOrUpvoteTag({tagId: tag._id, postId: postId, currentUser: botUser, context});
    }

    // fetch all posts above X karma without markets posted in 2022 or later
    const highKarmaNoMarketPosts = await Posts.find({baseScore: {$gte: 100}, postedAt: {$gte: `2022-01-01`}, manifoldReviewMarketId: null}, {projection: {_id: 1, title: 1, postedAt: 1, slug: 1}, limit:1}).fetch();

    const context = createAdminContext();

    const botUser = await context.Users.findOne({_id: reviewUserBot})

    highKarmaNoMarketPosts.forEach(async post => {


      const annualReviewLink = 'https://www.lesswrong.com/tag/lesswrong-review'
      const postLink = 'https://www.lesswrong.com/posts/' + post._id + '/' + post.slug
      const year = post.postedAt.getFullYear()
      const initialProb = 14
      const question = `Will "${post.title.length < 50 ? post.title : (post.title.slice(0,45)+"...")}" make the top fifty posts in LessWrong's ${year} Annual Review?`
      const descriptionMarkdown = `As part of LessWrong's [Annual Review](${annualReviewLink}), the community nominates, writes reviews, and votes on the most valuable posts. Posts are reviewable once they have been up for at least 12 months, and the ${year} Review resolves in February ${year+2}.\n\n\nThis market will resolve to 100% if the post [${post.title}](${postLink}) is one of the top fifty posts of the ${year} Review, and 0% otherwise. The market was initialized to ${initialProb}%.` // post.title
      const closeTime = new Date(year + 2, 1, 1) // i.e. february 1st of the next next year (so if year is 2022, feb 1 of 2024)
      const visibility = "unlisted" // set this based on whether we're in dev or prod?
      const groupIds = ["LessWrong Annual Review", `LessWrong ${year} Annual Review`]

      if (!botUser) throw new Error("Bot user not found")

      try {
        const result = await fetch("https://api.manifold.markets./v0/market", {
          method: "POST",
          headers: {
            authorization: `Key ${manifoldAPIKey}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            outcomeType: "BINARY",
            question: question,
            descriptionMarkdown: descriptionMarkdown,
            closeTime: Number(closeTime),
            visibility: visibility,
            // groupIds: groupIds,
            initialProb: initialProb
          })
        })

        // don't run this and also await result.text(), weirdly that causes the latter one to explode
        const liteMarket = await result.json() // get this from the result

        if (!result.ok) {
          throw new Error(`HTTP error! status: ${result.status}`);
        }

        // update the database to include the market id
        await Posts.rawUpdateOne(post._id, {$set: {manifoldReviewMarketId: liteMarket.id}})

        const reviewTagSlug = 'annual-review-market';
        const reviewYearTagSlug = `annual-review-${year}-market`;

        // add the review tags to the post
        await addTagToPost(post._id, reviewTagSlug, botUser, context);
        await addTagToPost(post._id, reviewYearTagSlug, botUser, context);

        // make a comment on the post with the market
        await makeComment(post._id, year, liteMarket.url, botUser)
      
        // ping the slack webhook to inform team of market creation. We will get rid of this before pushing to prod
        const webhookURL = "https://hooks.slack.com/triggers/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"
        void pingSlackWebhook(webhookURL, liteMarket)
        
      } catch (error) {
        //eslint-disable-next-line no-console
        console.error('There was a problem with the fetch operation for creating a Manifold Market: ', error);
      }
    })
  }
});
