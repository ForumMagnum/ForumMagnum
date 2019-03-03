import Users from 'meteor/vulcan:users';
import { schemaDefaultValue } from '../../collectionUtils';

const schema = {
  _id: {
    optional: true,
    type: String,
    viewableBy: Users.owns,
  },
  userId: {
    type: String,
    foreignKey: "Users",
    optional: true,
    viewableBy: Users.owns,
  },
  createdAt: {
    optional: true,
    type: Date,
    viewableBy: Users.owns,
    onInsert: (document, currentUser) => new Date(),
  },
  documentId: {
    type: String,
    // No explicit foreign-key relation because which collection this is depends on notification type
    optional: true,
    viewableBy: Users.owns,
  },
  documentType: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  link: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  title: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  message: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  type: {
    type: String,
    optional: true,
    viewableBy: Users.owns,
  },
  viewed: {
    type: Boolean,
    optional: true,
    defaultValue: false,
    viewableBy: ['members'],
    insertableBy: ['members'],
    editableBy: ['members'],
    ...schemaDefaultValue(false),
  },
};

export default schema;
