
import schema from "@/lib/collections/splashArtCoordinates/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

function editCheck(user: DbUser | null) {
  return userIsAdminOrMod(user);
}

export async function createSplashArtCoordinate({ data }: CreateSplashArtCoordinateInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('SplashArtCoordinates', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SplashArtCoordinates', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('SplashArtCoordinates', documentWithId);

  return documentWithId;
}

export async function updateSplashArtCoordinate({ selector, data }: UpdateSplashArtCoordinateInput, context: ResolverContext) {
  const { currentUser, SplashArtCoordinates } = context;

  const {
    documentSelector: splashartcoordinateSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('SplashArtCoordinates', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, SplashArtCoordinates, splashartcoordinateSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('SplashArtCoordinates', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}

export const createSplashArtCoordinateGqlMutation = makeGqlCreateMutation('SplashArtCoordinates', createSplashArtCoordinate, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});

export const updateSplashArtCoordinateGqlMutation = makeGqlUpdateMutation('SplashArtCoordinates', updateSplashArtCoordinate, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'SplashArtCoordinates', rawResult, context)
});




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
