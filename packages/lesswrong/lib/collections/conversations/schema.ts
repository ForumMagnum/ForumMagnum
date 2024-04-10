import { accessFilterSingle, arrayOfForeignKeysField, denormalizedCountOfReferences, resolverOnlyField, schemaDefaultValue } from '../../utils/schemaUtils'
import * as _ from 'underscore';
import { isLWorAF } from '../../instanceSettings';
import { getWithCustomLoader } from '../../loaders';
import { isFriendlyUI } from '../../../themes/forumTheme';

const schema: SchemaType<"Conversations"> = {
  title: {
    type: String,
    canRead: ['members'],
    canUpdate: ['members'],
    canCreate: ['members'],
    optional: true,
    label: isFriendlyUI ? "Conversation title (visible to all)" : "Conversation Title"
  },
  participantIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "participantIds",
      resolverName: "participants",
      collectionName: "Users",
      type: "User"
    }),
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: ['members'],
    optional: true,
    control: "FormUserMultiselect",
    label: "Participants",
  },
  'participantIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },
  latestActivity: {
    type: Date,
    denormalized: true,
    canRead: ['members'],
    onInsert: (document) => {
      return new Date(); // if this is an insert, set latestActivity to current timestamp
    },
    optional: true,
  },
  af: {
    type: Boolean,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['admins'],
    optional: true,
    hidden: !isLWorAF
  },
  messageCount: {
    ...denormalizedCountOfReferences({
      fieldName: "messageCount",
      collectionName: "Conversations",
      foreignCollectionName: "Messages",
      foreignTypeName: "message",
      foreignFieldName: "conversationId"
    }),
    canRead: ['guests'],
  },
  moderator: {
    type: Boolean,
    canRead: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    nullable: true
  },
  archivedByIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "archivedByIds",
      resolverName: "archivedBy",
      collectionName: "Users",
      type: "User"
    }),
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    ...schemaDefaultValue([]), // Note: this sets onUpdate and onCreate. onUpdate is overridden below
    // Allow users to only update their own archived status, this has some potential concurrency problems,
    // but I don't expect this to ever come up, and it fails relatively gracefully in case one does occur
    onUpdate: ({data, currentUser, oldDocument}) => {
      if (data?.archivedByIds) {
        const changedIds = _.difference(oldDocument?.archivedByIds || [], data?.archivedByIds)
        changedIds.forEach((id => {
          if (id !== currentUser!._id) {
            throw new Error(`You can't archive or unarchive a conversation for another user. Attempted update: ${JSON.stringify(data)}`)
          }
        }))
      }
      return data.archivedByIds ?? []
    }
  },
  'archivedByIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },
  latestMessage: resolverOnlyField({
    type: "Message",
    graphQLtype: "Message",
    canRead: ['members'],
    resolver: async (conversation: DbConversation, args, context: ResolverContext) => {
      const { tagId } = args;
      const { currentUser } = context;
      const message: DbMessage | null = await getWithCustomLoader<DbMessage | null, string>(
        context,
        "latestMessage",
        conversation._id,
        async (conversationIds: string[]): Promise<(DbMessage | null)[]> => {
          return await context.repos.conversations.getLatestMessages(conversationIds);
        }
      );
      const filteredMessage = await accessFilterSingle(currentUser, context.Messages, message, context)
      return filteredMessage;
    }
  }),
};

export default schema;
