import { universalFields } from "@/lib/collectionUtils";
import { foreignKeyField } from "@/lib/utils/schemaUtils";

const schema: SchemaType<"ReadStatuses"> = {
  ...universalFields({}),
  postId: {
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: true,
    }),
  },
  tagId: {
    ...foreignKeyField({
      idFieldName: "tagId",
      resolverName: "tag",
      collectionName: "Tags",
      type: "Tag",
      nullable: true,
    }),
  },
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: false,
    }),
    nullable: false,
  },
  isRead: {
    type: Boolean,
    nullable: false,
  },
  lastUpdated: {
    type: Date,
    nullable: false,
  },
};

export default schema;
