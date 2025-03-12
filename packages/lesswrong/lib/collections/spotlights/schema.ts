import range from "lodash/range";
import { schemaDefaultValue, resolverOnlyField, accessFilterSingle, accessFilterMultiple } from "../../utils/schemaUtils";
import { isLWorAF } from "../../instanceSettings";
import { editableFields } from "@/lib/editor/make_editable";
import { universalFields } from "@/lib/collectionUtils";

const SPOTLIGHT_DOCUMENT_TYPES = ['Sequence', 'Post', 'Tag'] as const;

interface ShiftSpotlightItemParams {
  startBound: number;
  endBound: number;
  offset: -1 | 1;
  context: ResolverContext;
}

/**
 * Range is not inclusive of the "end"
 * 
 * ex: Moving item from position 7 to position 3.  We want to shift items in the range of positions [3..6] to [4..7].
 * 
 * So range(3, 7) gives us [3,4,5,6].
 * 
 * `offset: -1` is to push items "backward" (when you're either creating a new spotlight item in the middle of the existing set, or moving one earlier in the order)
 * 
 * `offset: 1` is to pull items "forward" (when you're moving an existing item back)
 */
const shiftSpotlightItems = async ({ startBound, endBound, offset, context }: ShiftSpotlightItemParams) => {
  const shiftRange = range(startBound, endBound);

  // Shift the intermediate spotlights backward or forward (according to `offset`)
  await context.Spotlights.rawUpdateMany({ position: { $in: shiftRange } }, { $inc: { position: offset } }, { multi:true });
};

const schema: SchemaType<"Spotlights"> = {
  ...universalFields({}),

  ...editableFields("Spotlights", {
    fieldName: "description",
    commentEditor: true,
    commentStyles: true,
    hideControls: true,
    getLocalStorageId: (spotlight) => {
      if (spotlight._id) { return {id: `spotlight:${spotlight._id}`, verify:true} }
      return {id: `spotlight:create`, verify:true}
    },
    permissions: {
      canRead: ['guests'],
      canUpdate: ['admins', 'sunshineRegiment'],
      canCreate: ['admins', 'sunshineRegiment']
    },
    order: 100
  }),
  
  documentId: {
    type: String,
    nullable: false,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 10,
    // TODO: remove this once old clients have cycled out and aren't querying this field anymore
    // Has been replaced by the post, sequence, and tag fields
    resolveAs: {
      fieldName: 'document',
      addOriginalField: true,
      type: `Post!`,
      resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<Partial<DbPost | DbSequence | DbTag> | null> => {
        switch(spotlight.documentType) {
          case "Post": {
            const document = await context.loaders.Posts.load(spotlight.documentId);
            return accessFilterSingle(context.currentUser, 'Posts', document, context);
          }
          case "Sequence": {
            const document = await context.loaders.Sequences.load(spotlight.documentId);
            return accessFilterSingle(context.currentUser, 'Sequences', document, context);
          }
          case "Tag": {
            const document = await context.loaders.Tags.load(spotlight.documentId);
            return accessFilterSingle(context.currentUser, 'Tags', document, context);
          }
        }
      }
    },
  },

  post: resolverOnlyField({
    type: Object,
    graphQLtype: "Post",
    canRead: ['guests'],
    resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<Partial<DbPost> | null> => {
      if (spotlight.documentType !== "Post") {
        return null;
      }

      const post = await context.loaders.Posts.load(spotlight.documentId);
      return accessFilterSingle(context.currentUser, 'Posts', post, context);
    }
  }),

  sequence: resolverOnlyField({
    type: Object,
    graphQLtype: "Sequence",
    canRead: ['guests'],
    resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<Partial<DbSequence> | null> => {
      if (spotlight.documentType !== "Sequence") {
        return null;
      }

      const sequence = await context.loaders.Sequences.load(spotlight.documentId);
      return accessFilterSingle(context.currentUser, 'Sequences', sequence, context);
    }
  }),

  tag: resolverOnlyField({
    type: Object,
    graphQLtype: "Tag",
    canRead: ['guests'],
    resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<Partial<DbTag> | null> => {
      if (spotlight.documentType !== "Tag") {
        return null;
      }

      const tag = await context.loaders.Tags.load(spotlight.documentId);
      return accessFilterSingle(context.currentUser, 'Tags', tag, context);
    }
  }),
  
  /**
   * Type of document that is spotlighted, from the options in DOCUMENT_TYPES.
   * Note subtle distinction: those are type names, not collection names.
   */
  documentType: {
    type: String,
    typescriptType: 'SpotlightDocumentType',
    control: 'select',
    form: {
      options: () => SPOTLIGHT_DOCUMENT_TYPES.map(documentType => ({ label: documentType, value: documentType }))
    },
    ...schemaDefaultValue(SPOTLIGHT_DOCUMENT_TYPES[0]),
    allowedValues: [...SPOTLIGHT_DOCUMENT_TYPES],
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 20,
  },
  position: {
    type: Number,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 30,
    optional: true,
    nullable: false,
    onCreate: async ({ newDocument, context }) => {
      const [currentSpotlight, lastSpotlightByPosition] = await Promise.all([
        context.Spotlights.findOne({}, { sort: { lastPromotedAt: -1 } }),
        context.Spotlights.findOne({}, { sort: { position: -1 } })
      ]);
      
      // If we don't have an active spotlight (or any spotlight), the new one should be first
      if (!currentSpotlight || !lastSpotlightByPosition) {
        return 0;
      }

      // If we didn't specify a position, by default we probably want to be inserting it right after the currently-active spotlight
      // If we're instead putting the created spotlight somewhere before the last spotlight, shift everything at and after the desired position back
      const startBound = typeof newDocument.position !== 'number' ? currentSpotlight.position + 1 : newDocument.position;
      const endBound = lastSpotlightByPosition.position + 1;

      // Don't let us create a new spotlight with an arbitrarily large position
      if (newDocument.position > endBound) {
        return endBound;
      }

      // Push all the spotlight items both at and after the about-to-be-created item's position back by 1
      await shiftSpotlightItems({ startBound, endBound, offset: 1, context });

      // The to-be-created spotlight's position
      return startBound;
    },
    onUpdate: async ({ data, oldDocument, context }) => {
      if (typeof data.position === 'number' && data.position !== oldDocument.position) {
        // Figure out whether we're moving an existing spotlight item to an earlier position or a later position
        const pullingSpotlightForward = data.position < oldDocument.position;

        // Use that to determine which other spotlight items we need to move, and whether we correspondingly push them back or pull them forward
        const startBound = pullingSpotlightForward ? data.position : oldDocument.position + 1;
        const endBound = pullingSpotlightForward ? oldDocument.position : data.position + 1;
        const offset = pullingSpotlightForward ? 1 : -1;

        // Set the to-be-updated spotlight's position to something far out to avoid conflict with the spotlights we'll need to shift back
        await context.Spotlights.rawUpdateOne({ _id: oldDocument._id }, { $set: { position: 9001 } });

        // Shift the intermediate items backward
        await shiftSpotlightItems({ startBound, endBound, offset, context });        

        // The to-be-updated spotlight's position will get updated back to the desired position later in the mutator
        return data.position;
      }
    }
  },
  duration: {
    type: Number,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 40,
    ...schemaDefaultValue(3),
  },
  customTitle: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 50,
    optional: true,
    nullable: true
  },
  customSubtitle: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 60,
    optional: true,
    nullable: true
  },
  subtitleUrl: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 61,
    optional: true,
    nullable: true
  },
  headerTitle: {
    type: String,
    canRead: ["guests"],
    canUpdate: ["admins", "sunshineRegiment"],
    canCreate: ["admins", "sunshineRegiment"],
    order: 65,
    optional: true,
    nullable: true,
  },
  headerTitleLeftColor: {
    type: String,
    canRead: ["guests"],
    canUpdate: ["admins", "sunshineRegiment"],
    canCreate: ["admins", "sunshineRegiment"],
    order: 66,
    optional: true,
    nullable: true,
  },
  headerTitleRightColor: {
    type: String,
    canRead: ["guests"],
    canUpdate: ["admins", "sunshineRegiment"],
    canCreate: ["admins", "sunshineRegiment"],
    order: 67,
    optional: true,
    nullable: true,
  },
  lastPromotedAt: {
    type: Date,
    control: "datetime",
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 70,
    // Default to the epoch date if not specified
    ...schemaDefaultValue(new Date(0)),
  },
  spotlightSplashImageUrl: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    optional: true,
    nullable: true,
    tooltip: "Note: Large images can cause slow loading of the front page. Consider using the Cloudinary uploader instead (which will automatically resize the image)",
    order: 88,
  },
  draft: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 80,
    ...schemaDefaultValue(true),
  },
  deletedDraft: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    order: 80,
    optional: true,
    nullable: true,
    tooltip: "Remove from the spotlights page, but keep in the database.",
    ...schemaDefaultValue(false),
  },
  showAuthor: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 85,
    ...schemaDefaultValue(false),
   optional: true,
   nullable: false,
  },
  imageFade: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 86,
    optional: true,
    nullable: false,
    // we're not using schemaDefaultValue because we can't use forumType
    // conditionals without breaking schema hash logic
    defaultValue: true,
    onCreate: ({document}) => document.imageFade ?? (isLWorAF ? false : true),
    canAutofillDefault: true,
  },
  imageFadeColor: {
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    type: String,
    order: 87,
    optional: true,
    nullable: true,
    control: "FormComponentColorPicker",
  },

  spotlightImageId: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    control: "ImageUpload",
    optional: true,
    nullable: true,
    order: 90,
  },
  spotlightDarkImageId: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    control: "ImageUpload",
    optional: true,
    nullable: true,
    order: 100,
  },
  sequenceChapters: resolverOnlyField({
    type: Array,
    graphQLtype: '[Chapter]',
    canRead: ['guests'],
    resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<Partial<DbChapter>[]|null> => {
      if (!spotlight.documentId || spotlight.documentType !== "Sequence") {
        return null;
      }
      const chapters = await context.Chapters.find({
        sequenceId: spotlight.documentId,
      }, {
        limit: 100,
        sort: {number:1},
      }).fetch();
      
      return await accessFilterMultiple(context.currentUser, 'Chapters', chapters, context);
    }
  }),
  "sequenceChapters.$": {
    type: "Chapter",
    foreignKey: "Chapters",
    optional: true,
  },
};

export default schema;
