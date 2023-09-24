import { addCronJob } from '../cronUtil';
import RSSFeeds from '../../lib/collections/rssfeeds/collection';
import { createMutator, Globals, updateMutator } from '../vulcan-lib';
import { Posts } from '../../lib/collections/posts';
import Users from '../../lib/collections/users/collection';
import { asyncForeachSequential } from '../../lib/utils/asyncUtils';
import feedparser from 'feedparser-promised';
import { userIsAdminOrMod } from '../../lib/vulcan-users';
import { defineMutation } from '../utils/serverGraphqlUtil';

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
    var body;

    if (newPost['content:encoded'] && newPost.displayFullContent) {
      body = newPost['content:encoded'];
    } else if (newPost.description) {
      body = newPost.description;
    } else if (newPost.summary) {
      body = newPost.summary;
    } else {
      body = "";
    }

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
    if (!userIsAdminOrMod(currentUser) && currentUser._id != feed.userId) {
      throw new Error("Only admins and moderators ca manually resync RSS feeds they don't own");
    }
    
    await resyncFeed(feed);
    return true;
  }
});

addCronJob({
  name: 'addNewRSSPosts',
  interval: 'every 10 minutes',
  job: runRSSImport
});

Globals.runRSSImport = runRSSImport
