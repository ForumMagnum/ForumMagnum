import { foreignKeyField } from "../../utils/schemaUtils";

export const schema: SchemaType<"PostViewTimes"> = {
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
  totalSeconds: {
    type: Number,
    nullable: false
  }
}
