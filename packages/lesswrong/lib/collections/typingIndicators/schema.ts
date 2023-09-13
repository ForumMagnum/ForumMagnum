import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbTypingIndicator> = {
  userId: {
    type: String,
    optional: true,
    canRead: ['members'],
    canCreate: ['members'],
  },
  documentId: {
    type: String,
    optional: true,
    canRead: ['members'],
    canCreate: ['members'],
  },  
  lastUpdated: {
    type: Date,
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: [userOwns],
  },
}

export default schema;
