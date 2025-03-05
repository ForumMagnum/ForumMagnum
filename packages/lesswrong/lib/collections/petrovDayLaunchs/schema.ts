import { addUniversalFields } from '../../collectionUtils';

const schema: SchemaType<"PetrovDayLaunchs"> = {
  ...addUniversalFields({}),
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
