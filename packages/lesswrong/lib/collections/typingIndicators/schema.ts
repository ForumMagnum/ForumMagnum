import { userOwns } from '../../vulcan-users/permissions';

const schema: SchemaType<"TypingIndicators"> = {
  userId: {
    type: String,
    nullable: false,
    canRead: ['members'],
    canCreate: ['members'],
  },
  documentId: {
    type: String,
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
