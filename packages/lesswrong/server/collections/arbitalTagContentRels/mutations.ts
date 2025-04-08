
import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";


function newCheck(user: DbUser | null, document: CreateArbitalTagContentRelDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbArbitalTagContentRel | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ArbitalTagContentRels', {
  createFunction: async ({ data }: CreateArbitalTagContentRelInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('ArbitalTagContentRels', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ArbitalTagContentRels', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ArbitalTagContentRels',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateArbitalTagContentRelInput, context) => {
    const { currentUser, ArbitalTagContentRels } = context;

    const {
      documentSelector: arbitaltagcontentrelSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('ArbitalTagContentRels', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, ArbitalTagContentRels, arbitaltagcontentrelSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'ArbitalTagContentRels',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createArbitalTagContentRelGqlMutation = makeGqlCreateMutation('ArbitalTagContentRels', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ArbitalTagContentRels', rawResult, context)
});

export const updateArbitalTagContentRelGqlMutation = makeGqlUpdateMutation('ArbitalTagContentRels', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ArbitalTagContentRels', rawResult, context)
});


export { createFunction as createArbitalTagContentRel, updateFunction as updateArbitalTagContentRel };


export const graphqlArbitalTagContentRelTypeDefs = gql`
  input CreateArbitalTagContentRelDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateArbitalTagContentRelInput {
    data: CreateArbitalTagContentRelDataInput!
  }
  
  input UpdateArbitalTagContentRelDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateArbitalTagContentRelInput {
    selector: SelectorInput!
    data: UpdateArbitalTagContentRelDataInput!
  }
  
  type ArbitalTagContentRelOutput {
    data: ArbitalTagContentRel
  }

  extend type Mutation {
    createArbitalTagContentRel(data: CreateArbitalTagContentRelDataInput!): ArbitalTagContentRelOutput
    updateArbitalTagContentRel(selector: SelectorInput!, data: UpdateArbitalTagContentRelDataInput!): ArbitalTagContentRelOutput
  }
`;
