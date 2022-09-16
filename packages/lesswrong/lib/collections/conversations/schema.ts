import { arrayOfForeignKeysField, denormalizedCountOfReferences } from '../../utils/schemaUtils'
import * as _ from 'underscore';
import { forumTypeSetting } from '../../instanceSettings';

const schema: SchemaType<DbConversation> = {
  title: {
    type: String,
    viewableBy: ['members'],
    editableBy: ['members'],
    insertableBy: ['members'],
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
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members'],
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
    viewableBy: ['members'],
    onInsert: (document) => {
      return new Date(); // if this is an insert, set latestActivity to current timestamp
    },
    optional: true,
  },
  af: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['admins'],
    optional: true,
    hidden: !['LessWrong', 'AlignmentForum'].includes(forumTypeSetting.get())
  },
  messageCount: {
    ...denormalizedCountOfReferences({
      fieldName: "messageCount",
      collectionName: "Conversations",
      foreignCollectionName: "Messages",
      foreignTypeName: "message",
      foreignFieldName: "conversationId"
    }),
    viewableBy: ['guests'],
  },
  moderator: {
    type: Boolean,
    viewableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    editableBy: ['admins', 'sunshineRegiment'],
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
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['members'],
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
