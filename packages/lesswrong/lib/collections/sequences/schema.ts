import { schemaDefaultValue, foreignKeyField, accessFilterSingle, accessFilterMultiple, resolverOnlyField } from '../../utils/schemaUtils';
import { getWithCustomLoader } from '../../loaders';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import { userOwns } from '../../vulcan-users/permissions';
import { editableFields } from '@/lib/editor/make_editable';
import { universalFields } from '../../collectionUtils';

const formGroups = {
  adminOptions: {
    name: "adminOptions",
    order: 2,
    label: preferredHeadingCase("Admin Options"),
    startCollapsed: false,
  },
  advancedOptions: {
    name: "advancedOptions",
    order: 3,
    label: preferredHeadingCase("Advanced Options"),
    startCollapsed: true,
  },
} satisfies Partial<Record<string, FormGroupType<"Sequences">>>;

const schema: SchemaType<"Sequences"> = {
  ...universalFields({}),
  
  ...editableFields("Sequences", {
    order: 20,
  }),
  
  lastUpdated: {
    type: Date,
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['members'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    onCreate: () => new Date(),
    onUpdate: () => new Date(),
    hidden: true,
  },
  
  userId: {
    ...foreignKeyField({
      idFieldName: "userId",
      resolverName: "user",
      collectionName: "Users",
      type: "User",
      nullable: true,
    }),
    optional: true,
    nullable: false,
    canRead: ['guests'],
    canCreate: ['admins'],
    canUpdate: ['admins'],
    group: () => formGroups.adminOptions,
    control: 'FormUserSelect',
    form: {
      label: "Set author",
    },
  },

  title: {
    type: String,
    optional: false,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    canCreate: ['members'],
    order: 10,
    placeholder: preferredHeadingCase("Sequence Title"),
    control: 'EditSequenceTitle',
  },
  
  // Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    canCreate: ['members'],
    label: "Banner Image",
    control: "ImageUpload",
  },
  
  // Cloudinary image id for the card image
  gridImageId: {
    type: String,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    canCreate: ['members'],
    control: "ImageUpload",
    label: "Card Image"
  },
  
  hideFromAuthorPage: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    canCreate: ['members'],
    label: "Hide from my user profile",
    ...schemaDefaultValue(false),
  },

  draft: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    canCreate: ['members'],
    control: "checkbox",
    ...schemaDefaultValue(false),
  },

  isDeleted: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canUpdate: [userOwns, 'admins', 'sunshineRegiment'],
    canCreate: ['members'],
    group: () => formGroups.advancedOptions,
    label: "Delete",
    tooltip: "Make sure you want to delete this sequence - it will be completely hidden from the forum.",
    control: "checkbox",
    ...schemaDefaultValue(false),
  },

  curatedOrder: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins'],
    canCreate: ['admins'],
    group: () => formGroups.adminOptions,
  },

  userProfileOrder: {
    type: Number,
    optional: true,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    group: () => formGroups.adminOptions,
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
    group: () => formGroups.adminOptions,
    control: "text",
    label: preferredHeadingCase("Collection Slug"),
    tooltip: "The machine-readable slug for the collection this sequence belongs to. Will affect links, so don't set it unless you have the slug exactly right.",
    resolveAs: {
      fieldName: 'canonicalCollection',
      addOriginalField: true,
      type: "Collection",
      // TODO: Make sure we run proper access checks on this. Using slugs means it doesn't
      // work out of the box with the id-resolver generators
      resolver: async (sequence: DbSequence, args: void, context: ResolverContext): Promise<Partial<DbCollection>|null> => {
        if (!sequence.canonicalCollectionSlug) return null;
        const collection = await context.Collections.findOne({slug: sequence.canonicalCollectionSlug})
        return await accessFilterSingle(context.currentUser, 'Collections', collection, context);
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
    group: () => formGroups.adminOptions,
    tooltip: "Hidden sequences don't show up on lists/search results on this site, but can still be accessed directly by anyone",
  },

  noindex: {
    type: Boolean,
    optional: true,
    canRead: ['guests'],
    canCreate: ['admins', 'sunshineRegiment'],
    canUpdate: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
    group: () => formGroups.adminOptions,
  },

  postsCount: resolverOnlyField({
    type: Number,
    graphQLtype: 'Int!',
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
    graphQLtype: 'Int!',
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
        "sequenceReadPostsCount",
        createCompositeId(sequence._id, currentUser._id),
        (compositeIds): Promise<number[]> => {
          return context.repos.sequences.readPostsCount(compositeIds.map(splitCompositeId));
        }
      );

      return count;
    }
  }),
  
  // This resolver isn't used within LessWrong AFAICT, but is used by an external API user
  chaptersDummy: {
    type: Array,
    optional: true,
    canRead: ['guests'],
    resolveAs: {
      fieldName: 'chapters',
      type: '[Chapter]',
      resolver: async (sequence: DbSequence, args: void, context: ResolverContext): Promise<Partial<DbChapter>[]> => {
        const chapters = await context.Chapters.find(
          {sequenceId: sequence._id},
          {sort: {number: 1}},
        ).fetch();
        return await accessFilterMultiple(context.currentUser, 'Chapters', chapters, context);
      }
    }
  },

  'chaptersDummy.$': {
    type: String,
    foreignKey: "Chapters",
    optional: true,
  },

  /* Alignment Forum fields */

  af: {
    type: Boolean,
    optional: true,
    nullable: false,
    label: "Alignment Forum",
    ...schemaDefaultValue(false),
    canRead: ['guests'],
    canUpdate: ['alignmentVoters'],
    canCreate: ['alignmentVoters'],
  },
};

export default schema;
