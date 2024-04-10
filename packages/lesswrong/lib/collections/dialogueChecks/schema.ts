import { accessFilterSingle, resolverOnlyField, schemaDefaultValue } from "../../utils/schemaUtils";

const schema: SchemaType<"DialogueChecks"> = {
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
  },
  checkedAt: {
    type: Date,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
  },
  match: {
    type: Boolean,
    nullable: false,
    canRead: ['members'],
    // Defined in server/resolvers/dialogueChecksResolvers.ts
  },
  hideInRecommendations: {
    type: Boolean,
    nullable: false,
    ...schemaDefaultValue(false),
    canRead: ['members'],
    canCreate: ['members'],
  },
  matchPreference: resolverOnlyField({
    type: 'DialogueMatchPreference',
    graphQLtype: 'DialogueMatchPreference',
    canRead: ['members', 'admins'],
    resolver: async (dialogueCheck: DbDialogueCheck, args: void, context: ResolverContext) => {
      const { DialogueMatchPreferences, DialogueChecks } = context;
      const matchPreference = await DialogueMatchPreferences.findOne({dialogueCheckId: dialogueCheck._id, deleted: {$ne: true}});
      return await accessFilterSingle(context.currentUser, DialogueMatchPreferences, matchPreference, context);
    }
  }),
  reciprocalMatchPreference: resolverOnlyField({
    type: 'DialogueMatchPreference',
    graphQLtype: 'DialogueMatchPreference',
    canRead: ['members', 'admins'],
    resolver: async (dialogueCheck: DbDialogueCheck, args: void, context: ResolverContext) => {
      const { DialogueMatchPreferences, DialogueChecks } = context;
      const matchingDialogueCheck = await DialogueChecks.findOne({userId: dialogueCheck.targetUserId, targetUserId: dialogueCheck.userId});
      if (!matchingDialogueCheck) return null;
      const reciprocalMatchPreference = await DialogueMatchPreferences.findOne({dialogueCheckId: matchingDialogueCheck._id, deleted: {$ne: true}});
      return await accessFilterSingle(context.currentUser, DialogueMatchPreferences, reciprocalMatchPreference, context);
    }
  }),
}

export default schema;
