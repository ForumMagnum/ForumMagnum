import { ensureIndex } from "@/lib/collectionIndexUtils";
import { addUniversalFields } from "../../collectionUtils";
import { createCollection } from "../../vulcan-lib";
import schema from "./schema";

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
