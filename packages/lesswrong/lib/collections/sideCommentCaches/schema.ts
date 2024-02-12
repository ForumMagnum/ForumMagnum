import { foreignKeyField } from "../../utils/schemaUtils"

const commonFields = () => ({
  canRead: ["guests" as const],
  canCreate: ["guests" as const],
  canUpdate: ["guests" as const],
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
  annotatedHtml: {
    ...commonFields(),
    type: String,
  },
  commentsByBlock: {
    ...commonFields(),
    type: Object,
    blackbox: true,
  },
  version: {
    ...commonFields(),
    type: Number,
  },
};

export default schema;
