import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<DbTypingIndicator> = {
  userId: {
    type: String,
    optional: true,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
  },
  documentId: {
    type: String,
    optional: true,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
  },  
  lastUpdated: {
    type: Date,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
    canUpdate: [userOwns],
  },
}


export default schema;
