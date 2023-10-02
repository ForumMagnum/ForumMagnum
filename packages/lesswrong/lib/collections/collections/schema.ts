import { schemaDefaultValue } from '../../collectionUtils';
import { getWithCustomLoader } from '../../loaders';
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
    dependsOn: ['_id'],
    resolver: async (collection, args: void, context: ResolverContext) => {
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

  postsCount: resolverOnlyField({
    type: Number,
    canRead: ['guests'],
    dependsOn: ['_id'],
    resolver: async (collection, args: void, context: ResolverContext) => {
      const count = await getWithCustomLoader<number, string>(
        context,
        "collectionPostsCount",
        collection._id,
        (collectionIds): Promise<number[]> => {
          return context.repos.collections.postsCount(collectionIds);
        }
      );

      return count;
    }
  }),

  readPostsCount: resolverOnlyField({
    type: Number,
    canRead: ['guests'],
    dependsOn: ['_id'],
    resolver: async (collection, args: void, context: ResolverContext) => {
      const currentUser = context.currentUser;
      
      if (!currentUser) return 0;

      const createCompositeId = (collectionId: string, userId: string) => `${collectionId}-${userId}`;
      const splitCompositeId = (compositeId: string) => {
        const [collectionId, userId] = compositeId.split('-')
        return {collectionId, userId};
      };

      const count = await getWithCustomLoader<number, string>(
        context,
        "collectionReadPostsCount",
        createCompositeId(collection._id, currentUser._id),
        (compositeIds): Promise<number[]> => {
          return context.repos.collections.readPostsCount(compositeIds.map(splitCompositeId));
        }
      );

      return count;
    }
  }),

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

  noindex: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
  },
}


export default schema;
