import { foreignKeyField } from "../../utils/schemaUtils"

const commonFields = () => ({
  canRead: ["admins" as const],
  canCreate: ["admins" as const],
  canUpdate: ["admins" as const],
  hidden: true,
  optional: false,
  nullable: false,
});

const schema: SchemaType<"SideCommentCaches"> = {
  postId: {
    ...commonFields(),
    ...foreignKeyField({
      idFieldName: "postId",
      resolverName: "post",
      collectionName: "Posts",
      type: "Post",
      nullable: false,
    }),
  },
  version: {
    ...commonFields(),
    type: Number,
  },
  annotatedHtml: {
    ...commonFields(),
    type: String,
  },
  commentsByBlock: {
    ...commonFields(),
    type: Object,
    blackbox: true,
  },
};

export default schema;
