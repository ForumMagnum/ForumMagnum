import { foreignKeyField, resolverOnlyField, accessFilterMultiple } from '../../utils/schemaUtils'

const schema: SchemaType<DbCollection> = {

  // default properties
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true
    }),
    optional: true,
    canRead: ['guests'],
  },

  // Custom Properties

  title: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

  slug: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

  // Field that resolves to the array of books that belong to a sequence
  books: resolverOnlyField({
    type: Array,
    graphQLtype: '[Book]',
    canRead: ['guests'],
    resolver: async (collection: DbCollection, args: void, context: ResolverContext) => {
      const { currentUser, Books } = context;
      const books = await Books.find(
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
    canRead: ["guests"],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

  firstPageLink: {
    type: String,
    optional: true,
    canRead: ["guests"],
    canUpdate: ["admins"],
    canCreate: ["admins"],
  },

  hideStartReadingButton: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },
}


export default schema;
