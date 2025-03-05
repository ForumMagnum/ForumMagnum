import { addUniversalFields } from '../../collectionUtils';

const schema: SchemaType<"GoogleServiceAccountSessions"> = {
  ...addUniversalFields({}),
  email: {
    type: String,
    canRead: ['members'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
    nullable: false,
  },
  refreshToken: {
    type: String,
    canRead: [], // We don't really want this being sent over the network
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
    nullable: false,
  },
  estimatedExpiry: {
    type: Date,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
    nullable: false,
  },
  active: {
    type: Boolean,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
    nullable: false,
  },
  revoked: {
    type: Boolean,
    canRead: ['admins'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    hidden: true,
    nullable: false,
  },
};

export default schema;
