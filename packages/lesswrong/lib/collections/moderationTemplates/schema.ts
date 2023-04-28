import {schemaDefaultValue} from "../../collectionUtils";

export const ALLOWABLE_COLLECTIONS: TemplateType[] = ['Messages', 'Comments', 'Rejections'];

export type TemplateType = 'Messages' | 'Comments' | 'Rejections';

const schema: SchemaType<DbModerationTemplate> = {
  name: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 1,
  },
  // This field is misnamed - it doesn't have anything to do with objects on foreign collections.  It's just a "type".
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
