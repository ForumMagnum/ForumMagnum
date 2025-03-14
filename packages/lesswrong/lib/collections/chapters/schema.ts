import { editableFields } from '@/lib/editor/make_editable'
import { foreignKeyField, arrayOfForeignKeysField } from '../../utils/schemaUtils'
import { universalFields } from '../../collectionUtils';

export const formGroups: Partial<Record<string, FormGroupType<"Chapters">>> = {
  chapterDetails: {
    name: "chapterDetails",
    order: 25,
    label: "Chapter Details",
    startCollapsed: true,
  },
}

const schema: SchemaType<"Chapters"> = {
  ...universalFields({}),
  ...editableFields("Chapters", {
    order: 30,
    getLocalStorageId: (chapter, name) => {
      if (chapter._id) { return {id: `${chapter._id}_${name}`, verify: true} }
      return {id: `sequence: ${chapter.sequenceId}_${name}`, verify: false}
    },
  }),
  
  title: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ["admins"],
    canCreate: ['admins'],
    placeholder:"Title",
    order: 10,
    group: () => formGroups.chapterDetails
  },

  subtitle: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ["admins"],
    canCreate: ['admins'],
    placeholder:"Subtitle",
    order: 20,
    group: () => formGroups.chapterDetails
  },

  number: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    group: () => formGroups.chapterDetails
  },

  sequenceId: {
    ...foreignKeyField({
      idFieldName: "sequenceId",
      resolverName: "sequence",
      collectionName: "Sequences",
      type: "Sequence",
      nullable: false,
    }),
    optional: true,
    hidden: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
  },

  postIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "postIds",
      resolverName: "posts",
      collectionName: "Posts",
      type: "Post"
    }),
    optional: false,
    canRead: ["guests"],
    canUpdate: ["members"],
    canCreate: ['members'],
    control: 'PostsListEditor',
  },

  "postIds.$": {
    type: String,
    foreignKey: "Posts",
    optional: true,
  },
}

export default schema;
