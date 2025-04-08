
import schema from "@/lib/collections/googleServiceAccountSessions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null, document: DbGoogleServiceAccountSession | null) {
  if (!user || !document) return false;
  return userIsAdmin(user)
}

function editCheck(user: DbUser | null, document: DbGoogleServiceAccountSession | null) {
  if (!user || !document) return false;
  return userIsAdmin(user)
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('GoogleServiceAccountSessions', {
  createFunction: async ({ data }: CreateGoogleServiceAccountSessionInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('GoogleServiceAccountSessions', {
      context,
      data,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'GoogleServiceAccountSessions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'GoogleServiceAccountSessions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateGoogleServiceAccountSessionInput, context) => {
    const { currentUser, GoogleServiceAccountSessions } = context;

    const {
      documentSelector: googleserviceaccountsessionSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('GoogleServiceAccountSessions', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, GoogleServiceAccountSessions, googleserviceaccountsessionSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'GoogleServiceAccountSessions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createGoogleServiceAccountSessionGqlMutation = makeGqlCreateMutation('GoogleServiceAccountSessions', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'GoogleServiceAccountSessions', rawResult, context)
});

export const updateGoogleServiceAccountSessionGqlMutation = makeGqlUpdateMutation('GoogleServiceAccountSessions', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'GoogleServiceAccountSessions', rawResult, context)
});


export { createFunction as createGoogleServiceAccountSession, updateFunction as updateGoogleServiceAccountSession };


export const graphqlGoogleServiceAccountSessionTypeDefs = gql`
  input CreateGoogleServiceAccountSessionDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateGoogleServiceAccountSessionInput {
    data: CreateGoogleServiceAccountSessionDataInput!
  }
  
  input UpdateGoogleServiceAccountSessionDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateGoogleServiceAccountSessionInput {
    selector: SelectorInput!
    data: UpdateGoogleServiceAccountSessionDataInput!
  }
  
  type GoogleServiceAccountSessionOutput {
    data: GoogleServiceAccountSession
  }

  extend type Mutation {
    createGoogleServiceAccountSession(data: CreateGoogleServiceAccountSessionDataInput!): GoogleServiceAccountSessionOutput
    updateGoogleServiceAccountSession(selector: SelectorInput!, data: UpdateGoogleServiceAccountSessionDataInput!): GoogleServiceAccountSessionOutput
  }
`;
