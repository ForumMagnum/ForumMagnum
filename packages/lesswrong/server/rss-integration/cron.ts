import { addCronJob } from '../cronUtil';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { Globals } from '../../lib/vulcan-lib/config';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import feedparser from 'feedparser-promised';
import { userIsAdminOrMod } from '../../lib/vulcan-users';
import { defineMutation, defineQuery } from '../utils/serverGraphqlUtil';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { diffHtml } from '../resolvers/htmlDiff';
import { sanitize } from '../../lib/vulcan-lib/utils';
import { dataToHTML } from '../editor/conversionUtils';
import { createNotification } from '../notificationCallbacksHelpers';
import { computeContextFromUser, createAdminContext } from '../vulcan-lib';
import { maxPostsToSyncAtOnce } from '../../components/rss/ReviewRssCrosspostsPage';

const runRSSImport = async () => {
  const feeds = await RSSFeeds.find({status: {$ne: 'inactive'}}).fetch()
  // eslint-disable-next-line no-console
  console.log(`Refreshing ${feeds.length} RSS feeds`);
  await asyncForeachSequential(feeds, async feed => {
    try {
      await resyncFeed(feed);
    } catch(error) {
      //eslint-disable-next-line no-console
      console.error(`RSS error when refreshing feed ${feed.url}: ${(""+error).substring(0,100)}`);
    }
  })
}

async function resyncFeed(feed: DbRSSFeed): Promise<void> {
  console.log(`Resyncing RSS feed ${feed._id}`);
  // create array of all posts in current rawFeed object
  let previousPosts = feed.rawFeed || [];

  // check the feed for new posts
  const url = feed.url;
  const currentPosts = await feedparser.parse(url);
  
  const newPosts = await filterNonDuplicateRssCrossposts(currentPosts, previousPosts);
  
  // update feed object with new feed data (mutation)
  var set: any = {};
  set.rawFeed = currentPosts;

  await updateMutator({
    collection: RSSFeeds,
    documentId: feed._id,
    set: set,
    validate: false,
  })
  
  const isDraft = !!feed.importAsDraft;
  
  const user = await Users.findOne({_id: feed.userId});
  if (!user) {
    throw new Error("Missing user for RSS crosspost");
  }
  const context: ResolverContext = await computeContextFromUser(user);
  console.log(`Creating ${newPosts.length} new RSS crossposts`);

  await asyncForeachSequential(newPosts, async newPost => {
    const body = getRssPostContents(newPost);

    var post: Partial<DbInsertion<DbPost>> = {
      title: newPost.title,
      userId: feed.userId,
      canonicalSource: feed.setCanonicalUrl ? newPost.link : undefined,
      contents: {
        originalContents: {
          type: "html",
          data: body
        }
      },
      feedId: feed._id,
      feedLink: newPost.link,
      draft: isDraft,
    };

    console.log(`Creating crosspost draft for post ${post.title}`);

    const createdPost = await createMutator({
      collection: Posts,
      document: post,
      currentUser: user,
      validate: false,
    })
    
    await notifyUserOfRssCrosspostForReview(user, createdPost.data, isDraft, context);
  })
}

async function filterNonDuplicateRssCrossposts(currentPosts: any[], previousPosts: any[]) {
  // FIXME: We only detect duplicates by comparing against the previous return
  // value of the RSS feed, rather than attaching GUIDs to posts in the Posts
  // table.

  const newPosts = currentPosts
    .filter(function (post: AnyBecauseTodo) {
      return !previousPosts.some((prevPost: AnyBecauseTodo) => {
        return post.guid === prevPost.guid
      })
    })
    .slice(0, maxPostsToSyncAtOnce);
  
  return newPosts;
}

async function notifyUserOfRssCrosspostForReview(user: DbUser, post: DbPost, isDraft: boolean, context: ResolverContext) {
  console.log(`Creating notification for post ${post.title}`);
  await createNotification({
    userId: user._id,
    notificationType: "rssCrosspostCreated",
    documentType: "post",
    documentId: post._id,
    context
  });
}

function getRssPostContents(rssPost: AnyBecauseHard): string {
  if (rssPost['content:encoded'] && rssPost.displayFullContent) {
    return rssPost['content:encoded'];
  } else if (rssPost.description) {
    return rssPost.description;
  } else if (rssPost.summary) {
    return rssPost.summary;
  } else {
    return "";
  }
}

defineMutation({
  name: "resyncRssFeed",
  argTypes: "(feedId: String!)",
  resultType: "Boolean!",
  fn: async (_root: void, args: {feedId: string}, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) throw new Error("Must be logged in");

    const feed = await RSSFeeds.findOne({_id: args.feedId});

    if (!feed) {
      throw new Error("Invalid feed ID");
    }
    if (!userIsAdminOrMod(currentUser) && currentUser._id !== feed.userId) {
      throw new Error("Only admins and moderators can manually resync RSS feeds they don't own");
    }
    
    await resyncFeed(feed);
    return true;
  }
});

defineQuery({
  name: "RssPostChanges",
  argTypes: "(postId: String!)",
  resultType: "RssPostChangeInfo!",
  schema: `
    type RssPostChangeInfo {
      isChanged: Boolean!
      newHtml: String!
      htmlDiff: String!
    }
  `,
  fn: async (_root: void, args: {postId: string}, context: ResolverContext) => {
    // Find and validate the post, feed, etc
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    const post = await accessFilterSingle(currentUser, Posts,
      await context.loaders.Posts.load(args.postId),
      context
    );
    if (!post) {
      throw new Error("Invalid postId");
    }
    if (post.userId !== currentUser._id && !userIsAdminOrMod(currentUser)) {
      throw new Error("You can only RSS-resync your own posts"); 
    }
    const feedId = post.feedId;
    if (!feedId) {
      throw new Error("This post is not associated with an RSS feed");
    }
    const feed = await accessFilterSingle(currentUser, RSSFeeds,
      await context.loaders.RSSFeeds.load(feedId),
      context
    );
    if (!feed) {
      throw new Error("Invalid RSS feed");
    }
    
    // Refresh the RSS feed
    const feedUrl = feed.url
    const feedPosts = await feedparser.parse(feedUrl);
    
    // Find matching feed post
    let matchingPost = null;
    for (let feedPost of feedPosts) {
      if (feedPost.link === post.feedLink) {
        matchingPost = feedPost;
      }
    }
    if (!matchingPost) {
      throw new Error("Could not find matching post");
    }
    
    if (!post.contents?.originalContents) { 
      throw new Error("Post has no original contents.")
    }
    
    // Diff the contents between the RSS feed and the LW version
    const newHtml = sanitize(getRssPostContents(matchingPost));
    const oldHtml = sanitize(await dataToHTML(post.contents?.originalContents.data, post.contents?.originalContents.type ?? "", { sanitize: true }));
    const htmlDiff = diffHtml(oldHtml, newHtml, false);

    return {
      isChanged: oldHtml!==newHtml,
      newHtml: newHtml,
      htmlDiff: htmlDiff,
    };
  },
});

addCronJob({
  name: 'addNewRSSPosts',
  interval: 'every 10 minutes',
  job: runRSSImport
});

Globals.runRSSImport = runRSSImport
