import GraphQLJSON from "graphql-type-json";
import SimpleSchema from "simpl-schema";
import { accessFilterSingle } from "../../utils/schemaUtils";
import { addGraphQLSchema, getCollectionName } from "../../vulcan-lib";
import { collectionGetAllPostIDs } from "../collections/helpers";
import { Posts } from "../posts";
import { sequenceGetAllPostIDs } from "../sequences/helpers";
import { formGroups } from "./formGroups";

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
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.spotlight,
    order: 10,
    resolveAs: {
      fieldName: 'document',
      addOriginalField: true,
      // TODO: try a graphql union type?
      type: 'Post!',
      resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<DbPost | DbSequence | DbCollection | null> => {
        // console.log({ spotlight });
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
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    group: formGroups.spotlight,
    order: 20,
  },
  spotlightImageId: {
    type: String,
    viewableBy: ['guests'],
    editableBy: ['admins', 'sunshineRegiment'],
    insertableBy: ['admins', 'sunshineRegiment'],
    control: "ImageUpload",
    group: formGroups.spotlight,
    order: 30,
  },
  firstPost: {
    type: 'Post',
    viewableBy: ['guests'],
    optional: true,
    nullable: true,
    resolveAs: {
      type: 'Post',
      resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<DbPost | null> => {
        console.log({ spotlight });
        switch (spotlight.documentType) {
          case 'Post':
            return null;
          case 'Sequence': {
            const [firstPostId] = await sequenceGetAllPostIDs(spotlight.documentId, context);
            if (!firstPostId) {
              return null;
            }

            const firstPost = await context.loaders.Posts.load(firstPostId);
            console.log({ firstPost });
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
  }
};
  
export default schema;
  