import {schemaDefaultValue} from "../../collectionUtils";
import SimpleSchema from "simpl-schema";

const ALLOWABLE_COLLECTIONS: CollectionNameString[] = ['Messages', 'Comments'];

const ModerationTemplatesCollection = new SimpleSchema({
  documentType: {
    type: String,
    allowedValues: ALLOWABLE_COLLECTIONS,
  }
});

const schema: SchemaType<DbModerationTemplate> = {
  name: {
    type: String,
    viewableBy: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 1,
  },
  collectionName: {
    type: ModerationTemplatesCollection,
    typescriptType: "CollectionNameString",
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
    viewableBy: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    optional: true,
    ...schemaDefaultValue(0),
  },
  deleted: {
    type: Boolean,
    optional: true,
    canUpdate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
  },
};

export default schema;
