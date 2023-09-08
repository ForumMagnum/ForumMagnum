import { foreignKeyField, accessFilterSingle, accessFilterMultiple, resolverOnlyField } from '../../utils/schemaUtils';
import { schemaDefaultValue } from '../../collectionUtils';
import { getWithCustomLoader } from '../../loaders';

const schema: SchemaType<DbSequence> = {
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    control: 'text',
    tooltip: 'The user id of the author',
  },

  title: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    order: 10,
    placeholder: "Sequence Title",
    control: 'EditSequenceTitle',
  },

  // This resolver isn't used within LessWrong AFAICT, but is used by an external API user
  chaptersDummy: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      fieldName: 'chapters',
      type: '[Chapter]',
      resolver: async (sequence: DbSequence, args: void, context: ResolverContext): Promise<Array<DbChapter>> => {
        const chapters = await context.Chapters.find(
          {sequenceId: sequence._id},
          {sort: {number: 1}},
        ).fetch();
        return await accessFilterMultiple(context.currentUser, context.Chapters, chapters, context);
      }
    }
  },

  'chaptersDummy.$': {
    type: String,
    foreignKey: "Chapters",
    optional: true,
  },
  
  //Cloudinary image id for the grid Image
  gridImageId: {
    type: String,
    optional: true,
    order:25,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    control: "ImageUpload",
    label: "Card Image"
  },

  //Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    label: "Banner Image",
    control: "ImageUpload",
  },

  curatedOrder: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
  },

  userProfileOrder: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
  },

  draft: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    control: "checkbox",
    ...schemaDefaultValue(false),
  },

  isDeleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    hidden: true,
    control: "checkbox",
    ...schemaDefaultValue(false),
  },

  canonicalCollectionSlug: {
    type: String,
    foreignKey: {
      collection: "Collections",
      field: "slug",
    },
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    hidden: false,
    control: "text",
    order: 30,
    label: "Collection Slug",
    tooltip: "The machine-readable slug for the collection this sequence belongs to. Will affect links, so don't set it unless you have the slug exactly right.",
    resolveAs: {
      fieldName: 'canonicalCollection',
      addOriginalField: true,
      type: "Collection",
      // TODO: Make sure we run proper access checks on this. Using slugs means it doesn't
      // work out of the box with the id-resolver generators
      resolver: async (sequence: DbSequence, args: void, context: ResolverContext): Promise<DbCollection|null> => {
        if (!sequence.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({slug: sequence.canonicalCollectionSlug})
        return await accessFilterSingle(context.currentUser, context.Collections, collection, context);
      }
    }
  },

  hidden: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
  },

  hideFromAuthorPage: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['members'],
    canCreate: ['members'],
    ...schemaDefaultValue(false),
  },

  noindex: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
  },

  postsCount: resolverOnlyField({
    type: Number,
    canRead: ['guests'],
    resolver: async (sequence: DbSequence, args: void, context: ResolverContext) => {
      const count = await getWithCustomLoader<number, string>(
        context,
        "sequencePostsCount",
        sequence._id,
        (sequenceIds): Promise<number[]> => {
          return context.repos.sequences.postsCount(sequenceIds);
        }
      );

      return count;
    }
  }),

  readPostsCount: resolverOnlyField({
    type: Number,
    canRead: ['guests'],
    resolver: async (sequence: DbSequence, args: void, context: ResolverContext) => {
      const currentUser = context.currentUser;
      
      if (!currentUser) return 0;

      const createCompositeId = (sequenceId: string, userId: string) => `${sequenceId}-${userId}`;
      const splitCompositeId = (compositeId: string) => {
        const [sequenceId, userId] = compositeId.split('-')
        return {sequenceId, userId};
      };

      const count = await getWithCustomLoader<number, string>(
        context,
        "sequencePostsCount",
        createCompositeId(sequence._id, currentUser._id),
        (compositeIds): Promise<number[]> => {
          return context.repos.sequences.readPostsCount(compositeIds.map(splitCompositeId));
        }
      );

      return count;
    }
  }),

  /* Alignment Forum fields */

  af: {
    type: Boolean,
    optional: true,
    label: "Alignment Forum",
    defaultValue: false,
    canRead: ['guests'],
    canUpdate: ['alignmentVoters'],
    canCreate: ['alignmentVoters'],
  },
};

export default schema;
