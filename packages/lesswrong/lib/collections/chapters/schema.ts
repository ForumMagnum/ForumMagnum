import { foreignKeyField, arrayOfForeignKeysField } from '../../utils/schemaUtils'

export const formGroups: Partial<Record<string,FormGroup>> = {
  chapterDetails: {
    name: "chapterDetails",
    order: 25,
    label: "Chapter Details",
    startCollapsed: true,
  },
}

const schema: SchemaType<DbChapter> = {
  // Custom Properties

  title: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ["admins"],
    insertableBy: ['admins'],
    placeholder:"Title",
    order: 10,
    group: formGroups.chapterDetails
  },

  subtitle: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ["admins"],
    insertableBy: ['admins'],
    placeholder:"Subtitle",
    order: 20,
    group: formGroups.chapterDetails
  },

  number: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    group: formGroups.chapterDetails
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
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['members'],
  },

  postIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "postIds",
      resolverName: "posts",
      collectionName: "Posts",
      type: "Post"
    }),
    optional: false,
    viewableBy: ["guests"],
    editableBy: ["members"],
    insertableBy: ['members'],
    control: 'PostsListEditor',
  },

  "postIds.$": {
    type: String,
    foreignKey: "Posts",
    optional: true,
  },
}

export default schema;
