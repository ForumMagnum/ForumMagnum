
import schema from "@/lib/collections/splashArtCoordinates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('SplashArtCoordinates', {
  createFunction: async ({ data }: CreateSplashArtCoordinateInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('SplashArtCoordinates', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SplashArtCoordinates', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'SplashArtCoordinates',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateSplashArtCoordinateInput, context, skipValidation?: boolean) => {
    const { currentUser, SplashArtCoordinates } = context;

    const {
      documentSelector: splashartcoordinateSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('SplashArtCoordinates', { selector, context, data, schema, skipValidation });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, SplashArtCoordinates, splashartcoordinateSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'SplashArtCoordinates',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

export const createSplashArtCoordinateGqlMutation = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});

export const updateSplashArtCoordinateGqlMutation = makeGqlUpdateMutation('SplashArtCoordinates', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});


export { createFunction as createSplashArtCoordinate, updateFunction as updateSplashArtCoordinate };


export const graphqlSplashArtCoordinateTypeDefs = gql`
  input CreateSplashArtCoordinateDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateSplashArtCoordinateInput {
    data: CreateSplashArtCoordinateDataInput!
  }
  
  input UpdateSplashArtCoordinateDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateSplashArtCoordinateInput {
    selector: SelectorInput!
    data: UpdateSplashArtCoordinateDataInput!
  }
  
  type SplashArtCoordinateOutput {
    data: SplashArtCoordinate
  }

  extend type Mutation {
    createSplashArtCoordinate(data: CreateSplashArtCoordinateDataInput!): SplashArtCoordinateOutput
    updateSplashArtCoordinate(selector: SelectorInput!, data: UpdateSplashArtCoordinateDataInput!): SplashArtCoordinateOutput
  }
`;
