import {schemaDefaultValue} from "../../collectionUtils";
import { accessFilterSingle, resolverOnlyField } from "../../utils/schemaUtils";
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
  },
  matchPreference: resolverOnlyField({
    type: 'DialogueMatchPreference',
    graphQLtype: 'DialogueMatchPreference',
    canRead: ['members', 'admins'],
    resolver: async (dialogueCheck: DbDialogueCheck, args: void, context: ResolverContext) => {
      const { DialogueMatchPreferences, DialogueChecks } = context;
      const matchPreference = await DialogueMatchPreferences.findOne({dialogueCheckId: dialogueCheck._id});
      return await accessFilterSingle(context.currentUser, DialogueMatchPreferences, matchPreference, context);
    }
  }),
  matchingMatchPreference: resolverOnlyField({
    type: 'DialogueMatchPreference',
    graphQLtype: 'DialogueMatchPreference',
    canRead: ['members', 'admins'],
    resolver: async (dialogueCheck: DbDialogueCheck, args: void, context: ResolverContext) => {
      const { DialogueMatchPreferences, DialogueChecks } = context;
      const matchingDialogueCheck = await DialogueChecks.findOne({userId: dialogueCheck.targetUserId, targetUserId: dialogueCheck.userId});
      if (!matchingDialogueCheck) return null;
      const matchingMatchPreference = await DialogueMatchPreferences.findOne({dialogueCheckId: matchingDialogueCheck._id});
      return await accessFilterSingle(context.currentUser, DialogueMatchPreferences, matchingMatchPreference, context);
    }
  }),
}

export default schema;
