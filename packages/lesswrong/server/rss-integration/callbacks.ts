import { getCollectionHooks } from '../mutationCallbacks';

getCollectionHooks("RSSFeeds").newSync.add(async function populateRawFeed(feed) {
  const feedparser = require('feedparser-promised');
  const url = feed.url;
  const currentPosts = await feedparser.parse(url);
  feed.rawFeed = currentPosts;
  //eslint-disable-next-line no-console
  console.log("Imported new RSS feeds, set past posts to: ", feed.rawFeed);
  return feed;
});
