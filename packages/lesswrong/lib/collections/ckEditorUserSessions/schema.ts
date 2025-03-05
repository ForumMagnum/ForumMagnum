import { universalFields } from "@/lib/collectionUtils";

const schema: SchemaType<"CkEditorUserSessions"> = {
  ...universalFields({}),

  documentId: {
    type: String,
    nullable: false,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
  },
  userId: {
    type: String,
    nullable: false,
    canRead: ['admins'], 
    canCreate: ['admins'],
    canUpdate: ['admins'],
  },
  endedAt: {
    type: Date,
    optional: true,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
  },
  endedBy: {
    type: String,
    optional: true,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
  },
}

export default schema;
