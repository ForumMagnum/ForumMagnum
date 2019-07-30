import { foreignKeyField, resolverOnlyField } from '../../modules/utils/schemaUtils'

const schema = {

  // default properties

  _id: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
  },

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
    resolver: (collection, args, context) => {
      const books = context.Books.find(
        {collectionId: collection._id},
        {
          sort: {number: 1},
          fields: context.Users.getViewableFields(context.currentUser, context.Books)
        }
      ).fetch();
      return books
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
