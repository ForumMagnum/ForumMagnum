import GraphQLJSON from "graphql-type-json";
import { range } from "lodash";
import SimpleSchema from "simpl-schema";
import { schemaDefaultValue } from "../../collectionUtils";
import { accessFilterSingle } from "../../utils/schemaUtils";
import { addGraphQLSchema, getCollectionName } from "../../vulcan-lib";
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

const SpotlightFirstPost = new SimpleSchema({
  _id: {
    type: String
  },
  title: {
    type: String
  },
  slug: {
    type: String
  }
});

addGraphQLSchema(`
  type SpotlightFirstPost {
    _id: String
    title: String
    slug: String
  }
`);

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
    type: SimpleSchema.Integer,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    order: 30,
    onCreate: async ({ newDocument, context }) => {
      // const getCurrentSpotlight = () => context.Spotlights.findOne({}, { sort: { lastPromotedAt: -1 } });
      // const getLastSpotlightByPosition = () => context.Spotlights.findOne({}, { sort: { position: -1 } });
      const [currentSpotlight, lastSpotlightByPosition] = await Promise.all([
        context.Spotlights.findOne({}, { sort: { lastPromotedAt: -1 } }),
        context.Spotlights.findOne({}, { sort: { position: -1 } })
      ]);

      // Creating a new spotlight without specifying a position
      if (typeof newDocument.position !== 'number') {
        // If we don't have an active spotlight (or any spotlight), the new one should be first
        if (!currentSpotlight || !lastSpotlightByPosition) {
          return 0;
        }

        // Don't let us create a new spotlight with an arbitrarily large position
        if (newDocument.position > lastSpotlightByPosition.position + 1) {
          return lastSpotlightByPosition.position + 1;
        }

        // If we didn't specify a position, by default we probably want to be inserting it right after the currently-active spotlight
        const newSpotlightPosition = currentSpotlight.position + 1;

        // Push all the spotlight items both at and after the about-to-be-created item's position back by 1
        await context.Spotlights.rawUpdateMany({ position: { $gte: newSpotlightPosition } }, { $inc: { position: 1 } });
 
        // The to-be-created spotlight's position
        return newSpotlightPosition;

      // Creating a new spotlight while specifying the position
      } else {
        // If no spotlight exists, the new one should be first regardless of what we say
        if (!lastSpotlightByPosition) {
          return 0;
        }

        // Don't let us create a new spotlight with an arbitrarily large position
        if (newDocument.position > lastSpotlightByPosition.position + 1) {
          return lastSpotlightByPosition.position + 1;
        }

        
      }
    },
    onUpdate: async ({ data, oldDocument, context }) => {
      if (typeof data.position === 'number' && data.position !== oldDocument.position) {
        // Moving an existing spotlight item to an earlier position
        if (data.position < oldDocument.position) {
          const shiftStartBound = data.position;
          const shiftEndBound = oldDocument.position;

          // range is not inclusive of the "end"
          // ex: Moving item from position 7 to position 3
          // We want to shift items in the range of positions [3..6] to [4..7]
          // So range(3, 7) gives us [3,4,5,6]
          const shiftRange = range(shiftStartBound, shiftEndBound);

          // Set the to-be-updated spotlight's position to something far out to avoid conflict with the spotlights we'll need to shift back
          await context.Spotlights.rawUpdateOne({ _id: oldDocument._id }, { $set: { position: 9001 } });

          // Shift the intermediate spotlights back
          await context.Spotlights.rawUpdateMany({ position: { $in: shiftRange } }, { $inc: { position: 1 } });

          // The to-be-updated spotlight's position will get updated back to the desired position later in the mutator
          return data.position;

        // Moving an existing spotlight item to a later position
        } else {
          const shiftStartBound = oldDocument.position + 1;
          const shiftEndBound = data.position + 1;

          // range is not inclusive of the "end"
          // ex: Moving item from position 3 to position 7
          // We want to shift items in the range of positions [4..7] to [3..6]
          // So range(4, 8) gives us [4,5,6,7]
          const shiftRange = range(shiftStartBound, shiftEndBound);

          // Set the to-be-updated spotlight's position to something far out to avoid conflict with the spotlights we'll need to shift forward
          await context.Spotlights.rawUpdateOne({ _id: oldDocument._id }, { $set: { position: 9001 } });

          // Shift the intermediate spotlights forward
          await context.Spotlights.rawUpdateMany({ position: { $in: shiftRange } }, { $inc: { position: -1 } });

          // The to-be-updated spotlight's position will get updated back to the desired position later in the mutator
          return data.position;
        }
      }
    }
  },
  spotlightImageId: {
    type: String,
    canRead: ['guests'],
    canUpdate: ['admins', 'sunshineRegiment'],
    canCreate: ['admins', 'sunshineRegiment'],
    control: "ImageUpload",
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
};
  
export default schema;
