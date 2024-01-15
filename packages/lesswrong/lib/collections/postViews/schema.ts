import { foreignKeyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"PostViews"> = {
  windowStart: {
    type: Date,
    nullable: false
  },
  windowEnd: {
    type: Date,
    nullable: false
  },
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
  },
  viewCount: {
    type: Number,
    nullable: false
  },
}
