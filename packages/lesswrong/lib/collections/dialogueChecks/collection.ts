import {ensureIndex} from "../../collectionIndexUtils";
import {addUniversalFields, getDefaultMutations, getDefaultResolvers, schemaDefaultValue} from "../../collectionUtils";
import {MutationOptions} from "../../vulcan-core/default_mutations";
import {createCollection} from "../../vulcan-lib";
import {userOwns} from "../../vulcan-users/permissions";
//import schema from "./schema";

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
}


export const DialogueChecks: DialogueChecksCollection = createCollection({
  collectionName: 'DialogueChecks',
  typeName: 'DialogueCheck',
  collectionType: 'pg',
  schema,
  resolvers: getDefaultResolvers('DialogueChecks'),
  logChanges: true,
})


// TODO!!!: 
DialogueChecks.checkAccess = async (user: DbUser|null, document: DbDialogueCheck, context: ResolverContext|null): Promise<boolean> => {
  // You can access only if:
  // * you have a document with your userId and the targetUserId, and where Check is true 

  const gossippee = document.userId 
  // check if there is an existing document where gossipper is user, gossippee is targetUser, and Check is true

  return true // (vote.userId===currentUser._id || userIsAdminOrMod(currentUser));
};

addUniversalFields({ collection: DialogueChecks })

ensureIndex(DialogueChecks, { userId: 1, targetUserId: 1 }, { unique: true });

export default DialogueChecks;
