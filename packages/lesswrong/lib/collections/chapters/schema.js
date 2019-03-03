import { generateIdResolverSingle, generateIdResolverMulti } from '../../modules/utils/schemaUtils'

export const formGroups = {
  chapterDetails: {
    name: "chapterDetails",
    order: 25,
    label: "Chapter Details",
    startCollapsed: true,
  },
}

const schema = {
  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    onInsert: () => {
      return new Date();
    },
  },

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
    type: String,
    foreignKey: "Sequences",
    optional: true,
    hidden: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'sequence',
      type: 'Sequence',
      resolver: generateIdResolverSingle(
        {collectionName: 'Sequences', fieldName: 'sequenceId'}
      ),
      addOriginalField: true,
    }
  },

  postIds: {
    type: Array,
    optional: false,
    viewableBy: ["guests"],
    editableBy: ["members"],
    insertableBy: ['members'],
    resolveAs: {
      fieldName: 'posts',
      type: '[Post]',
      resolver: generateIdResolverMulti(
        {collectionName: 'Posts', fieldName: 'postIds'}
      ),
      addOriginalField: true,
    },
    control: 'PostsListEditor',
  },

  "postIds.$": {
    type: String,
    foreignKey: "Posts",
    optional: true,
  },
}

export default schema;
