import { userOwns } from '../../vulcan-users/permissions';
import { schemaDefaultValue } from '../../collectionUtils';

const schema: SchemaType<DbNotification> = {
  userId: {
    type: String,
    foreignKey: "Users",
    optional: true,
    viewableBy: userOwns,
  },
  documentId: {
    type: String,
    // No explicit foreign-key relation because which collection this is depends on notification type
    optional: true,
    viewableBy: userOwns,
  },
  documentType: {
    type: String,
    optional: true,
    viewableBy: userOwns,
  },
  extraData: {
    type: Object,
    blackbox: true,
    optional: true,
    viewableBy: userOwns,
  },
  link: {
    type: String,
    optional: true,
    viewableBy: userOwns,
  },
  title: {
    type: String,
    optional: true,
    viewableBy: userOwns,
  },
  message: {
    type: String,
    optional: true,
    viewableBy: userOwns,
  },
  type: {
    type: String,
    optional: true,
    viewableBy: userOwns,
  },
  deleted: {
    type: Boolean,
    optional: true,
    viewableBy: userOwns,
    ...schemaDefaultValue(false),
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
  emailed: {
    type: Boolean,
    ...schemaDefaultValue(false),
    viewableBy: userOwns,
  },
  waitingForBatch: {
    type: Boolean,
    ...schemaDefaultValue(false),
    viewableBy: userOwns,
  },
};

export default schema;
