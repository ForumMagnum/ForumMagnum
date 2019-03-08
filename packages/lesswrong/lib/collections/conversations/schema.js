import { arrayOfForeignKeysField } from '../../modules/utils/schemaUtils'

const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: ['members'],
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: ['members'],
    onInsert: (document) => new Date(),
  },
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
      return new Date(); // if this is an insert, set createdAt to current timestamp
    },
    optional: true,
  },
  af: {
    type: Boolean,
    viewableBy: ['guests'],
    insertableBy: ['members'],
    editableBy: ['admins'],
    optional: true,
  }
};

export default schema;
