
import schema from "@/lib/collections/splashArtCoordinates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

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
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('SplashArtCoordinates', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, SplashArtCoordinates, splashartcoordinateSelector, context) ?? previewDocument as DbSplashArtCoordinate;

    await runCountOfReferenceCallbacks({
      collectionName: 'SplashArtCoordinates',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('SplashArtCoordinates', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});


export { createFunction as createSplashArtCoordinate, updateFunction as updateSplashArtCoordinate };
export { wrappedCreateFunction as createSplashArtCoordinateMutation, wrappedUpdateFunction as updateSplashArtCoordinateMutation };


export const graphqlSplashArtCoordinateTypeDefs = gql`
  input CreateSplashArtCoordinateDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateSplashArtCoordinateInput {
    data: CreateSplashArtCoordinateDataInput!
  }
  
  input UpdateSplashArtCoordinateDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
