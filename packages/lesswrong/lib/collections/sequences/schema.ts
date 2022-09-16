import { foreignKeyField, accessFilterSingle, accessFilterMultiple } from '../../utils/schemaUtils';
import { schemaDefaultValue } from '../../collectionUtils';

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
    viewableBy: ['guests'],
    insertableBy: ['admins'],
    editableBy: ['admins'],
    control: 'text',
    tooltip: 'The user id of the author',
  },

  title: {
    type: String,
    optional: false,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    order: 10,
    placeholder: "Sequence Title",
    control: 'EditSequenceTitle',
  },

  // This resolver isn't used within LessWrong AFAICT, but is used by an external API user
  chaptersDummy: {
    type: Array,
    optional: true,
    viewableBy: ['guests'],
    resolveAs: {
      fieldName: 'chapters',
      type: '[Chapter]',
      resolver: async (sequence: DbSequence, args: void, context: ResolverContext): Promise<Array<DbChapter>> => {
        const chapters = await context.Chapters.find(
          {sequenceId: sequence._id},
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
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: "ImageUpload",
    label: "Card Image"
  },

  //Cloudinary image id for the banner image (high resolution)
  bannerImageId: {
    type: String,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    label: "Banner Image",
    control: "ImageUpload",
  },

  curatedOrder: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
  },

  userProfileOrder: {
    type: Number,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
  },

  draft: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    control: "checkbox",
    ...schemaDefaultValue(false),
  },

  isDeleted: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
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
    viewableBy: ['guests'],
    editableBy: ['admins'],
    insertableBy: ['admins'],
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
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    ...schemaDefaultValue(false),
  },

  hideFromAuthorPage: {
    type: Boolean,
    optional: true,
    viewableBy: ['guests'],
    editableBy: ['members'],
    insertableBy: ['members'],
    ...schemaDefaultValue(false),
  },
};

/* Alignment Forum fields */
Object.assign(schema, {
  af: {
    type: Boolean,
    optional: true,
    label: "Alignment Forum",
    defaultValue: false,
    viewableBy: ['guests'],
    editableBy: ['alignmentVoters'],
    insertableBy: ['alignmentVoters'],
  },
});

export default schema;
