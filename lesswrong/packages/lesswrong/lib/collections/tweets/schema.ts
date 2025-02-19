
const schema: SchemaType<"Tweets"> = {
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
