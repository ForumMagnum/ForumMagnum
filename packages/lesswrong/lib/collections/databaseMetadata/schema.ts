import { addUniversalFields } from '../../collectionUtils';

// The databaseMetadata collection is a collection of named, mostly-singleton
// values. (Currently just databaseId, which is used for ensuring you don't
// connect to a production database without using the corresponding config
// file.)

const schema: SchemaType<"DatabaseMetadata"> = {
  ...addUniversalFields({}),
  name: {
    type: String,
    nullable: false
  },
  value: {
    type: Object,
    blackbox: true,
    nullable: false
  },
};

export default schema;
