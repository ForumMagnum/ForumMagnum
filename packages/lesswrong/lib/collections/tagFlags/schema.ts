import { editableFields } from "@/lib/editor/make_editable";
import { slugFields, schemaDefaultValue } from "@/lib/utils/schemaUtils";

const schema: SchemaType<"TagFlags"> = {
  ...editableFields("TagFlags", {
    order: 30,
    getLocalStorageId: (tagFlag, name) => {
      if (tagFlag._id) { return {id: `${tagFlag._id}_${name}`, verify: true} }
      return {id: `tagFlag: ${name}`, verify: false}
    },
  }),
  ...slugFields("TagFlags", {
    getTitle: (tf) => tf.name,
    includesOldSlugs: false,
  }),
  name: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canUpdate: ['members', 'admins', 'sunshineRegiment'],
    canCreate: ['members', 'admins', 'sunshineRegiment'],
    order: 1
  },
  deleted: {
    optional: true,
    nullable: false,
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
    order: 2,
    ...schemaDefaultValue(false),
  },
  order: {
    type: Number,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'], 
  },
};

export default schema;
