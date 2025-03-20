import { addCronJob } from '../cron/cronUtil';
import RSSFeeds from '../../server/collections/rssfeeds/collection';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { Posts } from '../../server/collections/posts/collection';
import Users from '../../server/collections/users/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import feedparser from 'feedparser-promised';
import { userIsAdminOrMod } from '../../lib/vulcan-users/permissions';
import { accessFilterSingle } from '../../lib/utils/schemaUtils';
import { diffHtml } from '../resolvers/htmlDiff';
import { sanitize } from '../../lib/vulcan-lib/utils';
import { dataToHTML } from '../editor/conversionUtils';
import { fetchFragmentSingle } from '../fetchFragment';
import gql from 'graphql-tag';

export const runRSSImport = async () => {
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
  // create array of all posts in current rawFeed object
  let previousPosts = feed.rawFeed || [];

  // check the feed for new posts
  const url = feed.url;
  const currentPosts = await feedparser.parse(url);
  
  let newPosts: Array<any> = currentPosts.filter(function (post: AnyBecauseTodo) {
    return !previousPosts.some((prevPost: AnyBecauseTodo) => {
      return post.guid === prevPost.guid
    })
  })

  // update feed object with new feed data (mutation)
  var set: any = {};
  set.rawFeed = currentPosts;

  await updateMutator({
    collection: RSSFeeds,
    documentId: feed._id,
    set: set,
    validate: false,
  })

  await asyncForeachSequential(newPosts, async newPost => {
    const body = getRssPostContents(newPost);

    var post = {
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
      draft: !!feed.importAsDraft,
    };

    let lwUser = await Users.findOne({_id: feed.userId});

    await createMutator({
      collection: Posts,
      document: post,
      currentUser: lwUser,
      validate: false,
    })
  })
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

export const cronGraphQLTypeDefs = gql`
  type RssPostChangeInfo {
    isChanged: Boolean!
    newHtml: String!
    htmlDiff: String!
  }
  extend type Mutation {
    resyncRssFeed(feedId: String!): Boolean!
  }
  extend type Query {
    RssPostChanges(postId: String!): RssPostChangeInfo!
  }
`;

export const cronGraphQLQueries = {
  RssPostChanges: async (_root: void, args: {postId: string}, context: ResolverContext) => {
    // Find and validate the post, feed, etc
    const { currentUser } = context;
    if (!currentUser) {
      throw new Error("Not logged in");
    }

    const post = await fetchFragmentSingle({
      collectionName: "Posts",
      fragmentName: "PostsOriginalContents",
      currentUser: context.currentUser,
      selector: {_id: args.postId},
      context,
    });
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
    const feed = await accessFilterSingle(currentUser, 'RSSFeeds',
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
  }
}

export const cronGraphQLMutations = {
  resyncRssFeed: async (_root: void, args: {feedId: string}, context: ResolverContext) => {
    const { currentUser } = context;
    if (!currentUser) throw new Error("Must be logged in");

    const feed = await RSSFeeds.findOne({_id: args.feedId});

    if (!feed) {
      throw new Error("Invalid feed ID");
    }
    if (!userIsAdminOrMod(currentUser) && currentUser._id !== feed.userId) {
      throw new Error("Only admins and moderators ca manually resync RSS feeds they don't own");
    }
    
    await resyncFeed(feed);
    return true;
    
  }
}

export const addNewRSSPostsCron = addCronJob({
  name: 'addNewRSSPosts',
  interval: 'every 10 minutes',
  job: runRSSImport
});
