
import schema from "@/lib/collections/podcastEpisodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

function newCheck(user: DbUser | null) {
  return userIsAdmin(user) || userIsPodcaster(user);
}

function editCheck(user: DbUser | null) {
  return userIsAdmin(user) || userIsPodcaster(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('PodcastEpisodes', {
  createFunction: async ({ data }: CreatePodcastEpisodeInput, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PodcastEpisodes', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PodcastEpisodes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PodcastEpisodes',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'PodcastEpisodes', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdatePodcastEpisodeInput, context) => {
    const { currentUser, PodcastEpisodes } = context;

    const {
      documentSelector: podcastepisodeSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PodcastEpisodes', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, PodcastEpisodes, podcastepisodeSelector, context) ?? previewDocument as DbPodcastEpisode;

    await runCountOfReferenceCallbacks({
      collectionName: 'PodcastEpisodes',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'PodcastEpisodes', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createPodcastEpisode, updateFunction as updatePodcastEpisode };


export const graphqlPodcastEpisodeTypeDefs = gql`
  input CreatePodcastEpisodeDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreatePodcastEpisodeInput {
    data: CreatePodcastEpisodeDataInput!
  }
  
  input UpdatePodcastEpisodeDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdatePodcastEpisodeInput {
    selector: SelectorInput!
    data: UpdatePodcastEpisodeDataInput!
  }
  
  extend type Mutation {
    createPodcastEpisode(input: CreatePodcastEpisodeInput!): PodcastEpisode
    updatePodcastEpisode(input: UpdatePodcastEpisodeInput!): PodcastEpisode
  }
`;
