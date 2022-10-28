import {schemaDefaultValue} from "../../collectionUtils";
import SimpleSchema from "simpl-schema";

const ALLOWABLE_COLLECTIONS: CollectionNameString[] = ['Messages', 'Comments'];

type CollectionNameString = 'Messages' | 'Comments';

const CollectionNameType = new SimpleSchema({
  collectionName: {
    type: String,
    allowedValues: ALLOWABLE_COLLECTIONS,
  }
});

const schema: SchemaType<DbModerationTemplate> = {
  name: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 1,
  },
  collectionName: {
    type: CollectionNameType.schema('collectionName'),
    typescriptType: "CollectionNameType",
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canRead: ['guests'],
    control: 'select',
    form: {
      options: () => ALLOWABLE_COLLECTIONS.map(collectionName => ({ label: collectionName, value: collectionName }))
    },
  },
  defaultOrder: {
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
