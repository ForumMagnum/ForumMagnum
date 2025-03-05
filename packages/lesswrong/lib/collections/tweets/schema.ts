import { addUniversalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"Tweets"> = {
  ...addUniversalFields({}),
  postId: {
    type: String,
    nullable: false,
  },
  tweetId: {
    type: String,
    nullable: false,
  },
  content: {
    type: String,
    nullable: false,
  },
};

export default schema;
