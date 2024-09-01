import { arrayOfForeignKeysField } from '../../utils/schemaUtils';

const schema: SchemaType<"ClientIds"> = {
  clientId: {
    type: String,
    canRead: ['sunshineRegiment','admins'],
    nullable: false
  },
  firstSeenReferrer: {
    type: String,
    nullable: true,
    canRead: ['sunshineRegiment','admins'],
  },
  firstSeenLandingPage: {
    type: String,
    canRead: ['sunshineRegiment','admins'],
  },
  userIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "userIds",
      resolverName: "users",
      collectionName: "Users",
      type: "User",
    }),
    nullable: true,
    canRead: ['sunshineRegiment','admins'],
  },
  'userIds.$': {
    type: String,
    optional: true,
  },
}

export default schema;
