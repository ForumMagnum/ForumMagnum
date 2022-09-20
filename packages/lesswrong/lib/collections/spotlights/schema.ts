import GraphQLJSON from "graphql-type-json";
import SimpleSchema from "simpl-schema";
import { accessFilterSingle } from "../../utils/schemaUtils";
import { addGraphQLSchema, getCollectionName } from "../../vulcan-lib";
import { formGroups } from "./formGroups";

const DOCUMENT_TYPES = ['Post', 'Sequence', 'Collection'];
type DocumentType = 'Posts' | 'Sequences' | 'Collections';

const DocumentType = new SimpleSchema({
  documentType: {
    type: String,
    allowedValues: DOCUMENT_TYPES,
  }
});

addGraphQLSchema(`
  union SpotlightDocumentType = Post | Sequence | Collection
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
      // TODO: try a graphql union type
      type: GraphQLJSON, // "SpotlightDocumentType",
      resolver: async (spotlight: DbSpotlight, args: void, context: ResolverContext): Promise<DbPost | DbSequence | DbCollection | null> => {
        console.log({ spotlight });
        const collectionName = getCollectionName(spotlight.documentType) as DocumentType;
        const collection = context[collectionName];
        const document = await collection.findOne(spotlight.documentId);
        return accessFilterSingle(context.currentUser, collection, document, context);
      }
    },
  },
  documentType: {
    type: DocumentType.schema('documentType'),
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
  // firstPost: {

  // }
};
  
export default schema;
  