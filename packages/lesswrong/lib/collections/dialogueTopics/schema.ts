// should this be made via SimpleSchema or as a schema type on DbUsers?
const UserSchema: SchemaType<DbUser> = {
  userId: {
    type: String,
    optional: false,
  },
};

const schema: SchemaType<DbDialogueTopics> = {
  title: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  },
  createdAt: {
    type: Date,
    optional: false,
    canRead: ['guests'],
  },
  createdBy: {
    type: String,
    optional: false,
    canRead: ['guests'],
  },
  agreeUsers: {
    type: Array,
    optional: true,
    canRead: ['guests'],
  },
  'agreeUsers.$': UserSchema,
  disagreeUsers: {
    type: Array,
    optional: true,
    canRead: ['guests'],
  },
  'disagreeUsers.$': UserSchema,
}

export default schema;