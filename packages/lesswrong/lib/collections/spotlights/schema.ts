import range from "lodash/range";
import SimpleSchema from "simpl-schema";
import { schemaDefaultValue } from "../../collectionUtils";
import { accessFilterSingle } from "../../utils/schemaUtils";
import { getCollectionName } from "../../vulcan-lib";
import { collectionGetAllPostIDs } from "../collections/helpers";
import { Posts } from "../posts";
import { sequenceGetAllPostIDs } from "../sequences/helpers";

const DOCUMENT_TYPES = ['Post', 'Sequence', 'Collection'];

const SpotlightDocumentType = new SimpleSchema({
  documentType: {
    type: String,
    allowedValues: DOCUMENT_TYPES,
  }
});

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
  const shiftRange = range(startBound, endBound).reverse();
  console.log({shiftRange})

  // Shift the intermediate spotlights backward or forward (according to `offset`)
  await context.Spotlights.rawUpdateMany({ position: { $in: shiftRange } }, { $inc: { position: offset } }, {multi:true});
};

const schema: SchemaType<DbSpotlight> = {
  documentId: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 10,
    resolveAs: {
      fieldName: 'document',
      addOriginalField: true,
      // TODO: try a graphql union type?
      type: 'Post!',
      resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<DbPost | DbSequence | DbCollection | null> => {
        const collectionName = getCollectionName(spotlight.documentType) as SpotlightDocumentType;
        const collection = context[collectionName];
        const document = await collection.findOne(spotlight.documentId);
        return accessFilterSingle(context.currentUser, collection, document, context);
      }
    },
  },
  documentType: {
    type: SpotlightDocumentType.schema('documentType'),
    typescriptType: 'SpotlightDocumentType',
    control: 'select',
    form: {
      options: () => DOCUMENT_TYPES.map(documentType => ({ label: documentType, value: documentType }))
    },
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 20,
  },
  firstPost: {
    type: 'Post',
    canRead: ['guests'],
    optional: true,
    nullable: true,
    resolveAs: {
      type: 'Post',
      resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<DbPost | null> => {
        switch (spotlight.documentType) {
          case 'Post':
            return null;
          case 'Sequence': {
            const [firstPostId] = await sequenceGetAllPostIDs(spotlight.documentId, context);
            if (!firstPostId) {
              return null;
            }

            const firstPost = await context.loaders.Posts.load(firstPostId);
            return accessFilterSingle(context.currentUser, Posts, firstPost, context);
          }
          case 'Collection': {
            const [firstPostId] = await collectionGetAllPostIDs(spotlight.documentId, context);
            if (!firstPostId) {
              return null;
            }

            const firstPost = await context.loaders.Posts.load(firstPostId);
            return accessFilterSingle(context.currentUser, Posts, firstPost, context);
          }
        }
      }
    }
  },
  position: {
    type: Number,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 30,
    optional: true,
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

      console.log("step 3", {startBound, endBound})

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
  spotlightImageId: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    control: "ImageUpload",
    optional: true,
    nullable: true,
    order: 40,
  },
  draft: {
    type: Boolean,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 50,
    ...schemaDefaultValue(true),
  },
  lastPromotedAt: {
    type: Date,
    control: "datetime",
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 60,
    // Default to the epoch date if not specified
    ...schemaDefaultValue(new Date(0)),
  }
};
  
export default schema;
