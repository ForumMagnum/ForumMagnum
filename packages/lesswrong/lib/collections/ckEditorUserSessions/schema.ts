import { accessFilterSingle, resolverOnlyField, schemaDefaultValue } from "../../utils/schemaUtils";
import { userOwns } from "../../vulcan-users/permissions";

const schema: SchemaType<DbCkEditorUserSession> = {
  documentId: {
    type: String,
    nullable: false,
    canRead: ['admins'],
    canCreate: ['admins'],
  },
  userId: {
    type: String,
    nullable: false,
    canRead: ['admins'], 
    canCreate: ['admins'],
  },
  endedAt: {
    type: Date,
    optional: true,
    canRead: ['admins'],
    canCreate: ['admins'],
  },
}

export default schema;
