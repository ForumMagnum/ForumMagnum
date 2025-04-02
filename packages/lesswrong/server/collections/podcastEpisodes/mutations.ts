
import schema from "@/lib/collections/podcastEpisodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
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
  createFunction: async ({ data }: CreatePodcastEpisodeInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PodcastEpisodes', {
      context,
      data,
      schema,
      skipValidation,
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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePodcastEpisodeInput, context, skipValidation?: boolean) => {
    const { currentUser, PodcastEpisodes } = context;

    const {
      documentSelector: podcastepisodeSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PodcastEpisodes', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PodcastEpisodes', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('PodcastEpisodes', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PodcastEpisodes', rawResult, context)
});


export { createFunction as createPodcastEpisode, updateFunction as updatePodcastEpisode };
export { wrappedCreateFunction as createPodcastEpisodeMutation, wrappedUpdateFunction as updatePodcastEpisodeMutation };


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
