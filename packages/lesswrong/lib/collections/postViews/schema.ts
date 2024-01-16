import { foreignKeyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"PostViews"> = {
  updatedAt: {
    type: Date,
    nullable: false
  },
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
    nullable: false
  },
  viewCount: {
    type: Number,
    nullable: false
  },
  uniqueViewCount: {
    type: Number,
    nullable: false
  },
}
