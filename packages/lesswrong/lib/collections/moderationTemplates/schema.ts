import { editableFields } from '@/lib/editor/make_editable';
import { schemaDefaultValue } from '../../utils/schemaUtils';

export const ALLOWABLE_COLLECTIONS: TemplateType[] = ['Messages', 'Comments', 'Rejections'];

export type TemplateType = 'Messages' | 'Comments' | 'Rejections';

const schema: SchemaType<"ModerationTemplates"> = {
  ...editableFields("ModerationTemplates", {
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    order: 20
  }),
  name: {
    type: String,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: ['members'],
    order: 1,
    nullable: false,
  },
  // This field is misnamed - it doesn't have anything to do with objects on foreign collections.  It's just a "type".
  collectionName: {
    type: String,
    nullable: false,
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
    ...schemaDefaultValue(10), // set to 10 so that there's room to leave "primary" templates which show up earlier by default
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
