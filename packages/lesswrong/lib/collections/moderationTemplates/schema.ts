import {schemaDefaultValue} from "../../collectionUtils";

const ALLOWABLE_COLLECTIONS: CollectionNameString[] = ['Messages', 'Comments'];

type CollectionNameString = 'Messages' | 'Comments';

const schema: SchemaType<DbModerationTemplate> = {
  name: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 1,
  },
  collectionName: {
    type: String,
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canRead: ['guests'],
    control: 'select',
    allowedValues: ALLOWABLE_COLLECTIONS,
    form: {
      options: () => ALLOWABLE_COLLECTIONS.map(collectionName => ({ label: collectionName, value: collectionName }))
    },
  },
  order: {
    type: Number,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    ...schemaDefaultValue(0),
  },
  deleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
  },
};

export default schema;
