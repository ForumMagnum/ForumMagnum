import { foreignKeyField, resolverOnlyField, accessFilterMultiple } from '../../utils/schemaUtils'

const schema = {

  // default properties

  createdAt: {
    type: Date,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
    onInsert: () => new Date(),
  },

  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
    }),
    optional: true,
    viewableBy: ['guests'],
  },

  // Custom Properties

  title: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  slug: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  // Field that resolves to the array of books that belong to a sequence
  books: resolverOnlyField({
    type: Array,
    graphQLtype: '[Book]',
    viewableBy: ['guests'],
    resolver: async (collection, args, context: ResolverContext) => {
      const { currentUser, Books } = context;
      const books = Books.find(
        {collectionId: collection._id},
        {sort: {number: 1}}
      ).fetch();
      return await accessFilterMultiple(currentUser, Books, books, context);
    }
  }),

  'books.$': {
    type: String,
    foreignKey: "Books",
    optional: true,
  },

  gridImageId: {
    type: String,
    // Corresponds to a Cloudinary ID
    optional: true,
    viewableBy: ["guests"],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  firstPageLink: {
    type: String,
    optional: true,
    viewableBy: ["guests"],
    editableBy: ["admins"],
    insertableBy: ["admins"],
  }
}


export default schema;
