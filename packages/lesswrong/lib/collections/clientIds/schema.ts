import { addUniversalFields } from '@/lib/collectionUtils';
import { arrayOfForeignKeysField, schemaDefaultValue } from '../../utils/schemaUtils';

const schema: SchemaType<"ClientIds"> = {
  ...addUniversalFields({
    createdAtOptions: {canRead: ['admins']},
  }),

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
  invalidated: {
    type: Boolean,
    optional: true,
    canRead: ['sunshineRegiment','admins'],
    ...schemaDefaultValue(false),
  },
  lastSeenAt: {
    type: Date,
    optional: true,
    nullable: true,
    canRead: ['sunshineRegiment','admins'],
  },
  timesSeen: {
    type: Number,
    optional: true,
    canRead: ['sunshineRegiment','admins'],
    ...schemaDefaultValue(1),
  },
}

export default schema;
