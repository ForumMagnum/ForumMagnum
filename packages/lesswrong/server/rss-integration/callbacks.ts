export async function populateRawFeed(feed: Partial<DbInsertion<DbRSSFeed>>) {
  const feedparser = require('feedparser-promised');
  const url = feed.url;
  const currentPosts = await feedparser.parse(url);
  feed.rawFeed = currentPosts;
  //eslint-disable-next-line no-console
  console.log("Imported new RSS feeds, set past posts to: ", feed.rawFeed);
  return feed;
}
