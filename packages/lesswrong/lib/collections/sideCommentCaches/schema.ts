import { foreignKeyField } from "../../utils/schemaUtils"
import { universalFields } from "../../collectionUtils";

// Deny all permissions on these objects - they're only used internally
const commonFields = () => ({
  canRead: () => false,
  canCreate: () => false,
  canUpdate: () => false,
  hidden: true,
  optional: false,
  nullable: false,
});

const schema: SchemaType<"SideCommentCaches"> = {
  ...universalFields({}),
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
