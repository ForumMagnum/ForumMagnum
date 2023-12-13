import { accessFilterSingle, resolverOnlyField, schemaDefaultValue } from "../../utils/schemaUtils";
import {userOwns} from "../../vulcan-users/permissions";

const schema: SchemaType<DbCkEditorUserSession> = {
  documentId: {
    type: String,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
  },
  userId: {
    type: String,
    nullable: false,
    canRead: ['members'], 
    canCreate: ['members'],
  },
  endedAt: {
    type: Date,
    optional: true,
    canRead: ['members'],
    canCreate: ['members'],
  },
}

export default schema;
