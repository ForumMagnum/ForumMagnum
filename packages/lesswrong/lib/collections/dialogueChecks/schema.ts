import {schemaDefaultValue} from "../../collectionUtils";
import {userOwns} from "../../vulcan-users/permissions";

const schema: SchemaType<DbDialogueCheck> = {
  // permissions enforced via collection-level checkAccess
  userId: {
    type: String,
    nullable: false,
    canRead: ['members'], 
    canCreate: ['members'],
  },
  targetUserId: {
    type: String,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
  },
  checked: {
    type: Boolean,
    nullable: false,
    ...schemaDefaultValue(false),
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: [userOwns],
  },
  checkedAt: {
    type: Date,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: [userOwns],
  },
  match: {
    type: Boolean,
    nullable: false,
    canRead: ['members'],
    // Defined in server/resolvers/dialogueChecksResolvers.ts
  }
}

export default schema;
