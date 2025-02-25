import { ensureIndex } from "@/lib/collectionIndexUtils";
import { addUniversalFields } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib/collections";
import schema from "./schema";

/**
 * Tweets that have been posted by the forum twitter bot. Currently (2024-07-02)
 * posts are tweeted when they cross a certain karma threshold (see packages/lesswrong/server/twitterBot.ts)
 */
const Tweets: TweetsCollection = createCollection({
  collectionName: "Tweets",
  typeName: "Tweet",
  schema,
  logChanges: true,
});

addUniversalFields({
  collection: Tweets,
});

ensureIndex(Tweets, {postId: 1});
ensureIndex(Tweets, {tweetId: 1});

export default Tweets;
