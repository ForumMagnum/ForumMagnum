import { universalFields } from '../../collectionUtils';

const schema: SchemaType<"PetrovDayLaunchs"> = {
  ...universalFields({}),
  launchCode: {
    type: String,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  },
  hashedLaunchCode: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  },
  userId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
  }
}

export default schema;
