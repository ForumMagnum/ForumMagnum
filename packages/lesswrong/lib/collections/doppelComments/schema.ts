import { foreignKeyField, schemaDefaultValue } from "@/lib/utils/schemaUtils";

const schema: SchemaType<"DoppelComments"> = {
  commentId: {
    ...foreignKeyField({
      idFieldName: "commentId",
      collectionName: "Comments",
      resolverName: "mimickedComment",
      type: "Comment",
      nullable: true,
    }),
    optional: false,
    canRead: ["guests"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  content: {
    type: String,
    optional: false,
    nullable: true,
    canRead: ["guests"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
  },
  deleted: {
    type: Boolean,
    optional: true,
    nullable: false,
    canRead: ["guests"],
    canCreate: ["admins"],
    canUpdate: ["admins"],
    ...schemaDefaultValue(false),
  },
}

export default schema;
