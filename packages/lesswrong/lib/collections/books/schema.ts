import { arrayOfForeignKeysField } from '../../utils/schemaUtils'

const schema: SchemaType<"Books"> = {

  // default properties

  postedAt: {
    type: Date,
    optional: true,
    canRead: ['guests'],
    onInsert: () => new Date(),
  },

  // Custom Properties

  title: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
  },

  subtitle: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
  },

  // this overrides the book title in the CollectionsPage table of contents,
  // for books whose title needs to be different there for whatever reason.
  tocTitle: {
    type: String,
    optional: true,
    nullable: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
  },

  collectionId: {
    type: String,
    foreignKey: "Collections",
    optional: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['members'],
  },

  number: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

  postIds: {
    ...arrayOfForeignKeysField({
      idFieldName: "postIds",
      resolverName: "posts",
      collectionName: "Posts",
      type: "Post"
    }),
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
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
    nullable: false,
    canRead: ["guests"],
    canUpdate: ['members'],
    canCreate: ['members'],
    control: 'SequencesListEditor',
  },
  'sequenceIds.$': {
    type: String,
    foreignKey: "Sequences",
    optional: true,
  },
  displaySequencesAsGrid: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
  hideProgressBar: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
  showChapters: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

}


export default schema;
