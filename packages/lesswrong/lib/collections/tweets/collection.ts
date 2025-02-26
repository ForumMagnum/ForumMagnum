import { addUniversalFields } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";
import { DatabaseIndexSet } from "@/lib/utils/databaseIndexSet";

/**
 * Tweets that have been posted by the forum twitter bot. Currently (2024-07-02)
 * posts are tweeted when they cross a certain karma threshold (see packages/lesswrong/server/twitterBot.ts)
 */
const Tweets: TweetsCollection = createCollection({
  collectionName: "Tweets",
  typeName: "Tweet",
  schema,
  getIndexes: () => {
    const indexSet = new DatabaseIndexSet();
    indexSet.addIndex('Tweets', {postId: 1});
    indexSet.addIndex('Tweets', {tweetId: 1});
    return indexSet;
  },
  logChanges: true,
});

addUniversalFields({
  collection: Tweets,
});

export default Tweets;
