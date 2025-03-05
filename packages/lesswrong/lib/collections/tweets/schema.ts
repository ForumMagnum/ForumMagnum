import { universalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"Tweets"> = {
  ...universalFields({}),
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
