import { generateIdResolverSingle } from '../../modules/utils/schemaUtils'

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
    onInsert: () => {
      return new Date();
    },
  },

  userId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: 'user',
      type: 'User',
      resolver: generateIdResolverSingle(
        {collectionName: 'Users', fieldName: 'userId'}
      ),
      addOriginalField: true,
    }
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

  /*
    Dummy field that resolves to the array of books that belong to a sequence
  */

  books: {
    type: Array,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: 'books',
      type: '[Book]',
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
    }
  },

  'books.$': {
    type: String,
    optional: true,
  },

  gridImageId: {
    type: String,
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
