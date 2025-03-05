import { foreignKeyField } from "../../utils/schemaUtils";
import { universalFields } from "../../collectionUtils";

export const schema: SchemaType<"PostViewTimes"> = {
  ...universalFields({}),
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
  /** The clientId of the person viewing the post */
  clientId: {
    ...foreignKeyField({
      idFieldName: "clientId",
      resolverName: "clientId",
      collectionName: "ClientIds",
      type: "ClientId",
      nullable: false,
    }),
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
  /** The total number of seconds the given clientId spent on this post, in the given time window */
  totalSeconds: {
    type: Number,
    nullable: false
  }
}
