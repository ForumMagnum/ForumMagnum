import { createCollection } from "@/lib/vulcan-lib/collections";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

/**
 * Tweets that have been posted by the forum twitter bot. Currently (2024-07-02)
 * posts are tweeted when they cross a certain karma threshold (see packages/lesswrong/server/twitterBot.ts)
 */
export const Tweets = createCollection({
  collectionName: "Tweets",
  typeName: "Tweet",
    getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Tweets', {postId: 1});
    indexSet.addIndex('Tweets', {tweetId: 1});
    return indexSet;
  },
});


export default Tweets;
