import { arrayOfForeignKeysField } from '../../utils/schemaUtils'

const schema: SchemaType<DbBook> = {

  // default properties

  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: () => new Date(),
  },

  postedAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: () => new Date(),
  },
  
  // Custom Properties

  title: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  subtitle: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
  },

  collectionId: {
    type: String,
    foreignKey: "Collections",
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['members'],
  },

  number: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  postIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "postIds",
      resolverName: "posts",
      collectionName: "Posts",
      type: "Post"
    }),
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: 'PostsListEditor',
  },
  'postIds.$': {
    type: String,
    foreignKey: "Posts",
    optional: true,
  },

  sequenceIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "sequenceIds",
      resolverName: "sequences",
      collectionName: "Sequences",
      type: "Sequence"
    }),
    optional: true,
    viewableBy: ["guests"],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: 'SequencesListEditor',
  },
  'sequenceIds.$': {
    type: String,
    foreignKey: "Sequences",
    optional: true,
  }

}


export default schema;
