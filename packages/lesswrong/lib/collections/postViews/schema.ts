import { foreignKeyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"PostViews"> = {
  updatedAt: {
    type: Date,
    nullable: false
  },
  /** The start of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowStart: {
    type: Date,
    nullable: false
  },
  /** The end of the time window this row is counting over. Currently (2024-01-18) all windows are full UTC days */
  windowEnd: {
    type: Date,
    nullable: false
  },
  /** The post being viewed */
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
  /** The number of views on the post in the given window, including duplicates from the same user */
  viewCount: {
    type: Number,
    nullable: false
  },
  /**
   * The number of unique (by clientId) views on the post in the given window. Note that this is still
   * only for the given day, so views by the same user on different days will still be double counted
   */
  uniqueViewCount: {
    type: Number,
    nullable: false
  },
}
