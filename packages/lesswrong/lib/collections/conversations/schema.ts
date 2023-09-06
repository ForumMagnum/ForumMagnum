import { arrayOfForeignKeysField, denormalizedCountOfReferences } from '../../utils/schemaUtils'
import * as _ from 'underscore';
import { isLWorAF } from '../../instanceSettings';

const schema: SchemaType<DbConversation> = {
  title: {
    type: String,
    canRead: ['members'],
    canUpdate: ['members'],
    canCreate: ['members'],
    optional: true,
    label: "Conversation Title"
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
    control: "UsersListEditor",
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
    }
  },
  'archivedByIds.$': {
    type: String,
    foreignKey: "Users",
    optional: true,
  },
};

export default schema;
