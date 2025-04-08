
import schema from "@/lib/collections/podcastEpisodes/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";

function newCheck(user: DbUser | null) {
  return userIsAdmin(user) || userIsPodcaster(user);
}

function editCheck(user: DbUser | null) {
  return userIsAdmin(user) || userIsPodcaster(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('PodcastEpisodes', {
  createFunction: async ({ data }: CreatePodcastEpisodeInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('PodcastEpisodes', {
      context,
      data,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PodcastEpisodes', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('PodcastEpisodes', documentWithId);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdatePodcastEpisodeInput, context) => {
    const { currentUser, PodcastEpisodes } = context;

    const {
      documentSelector: podcastepisodeSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('PodcastEpisodes', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, PodcastEpisodes, podcastepisodeSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PodcastEpisodes', updatedDocument, updateCallbackProperties.oldDocument);

    return updatedDocument;
  },
});

export const createPodcastEpisodeGqlMutation = makeGqlCreateMutation('PodcastEpisodes', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PodcastEpisodes', rawResult, context)
});

export const updatePodcastEpisodeGqlMutation = makeGqlUpdateMutation('PodcastEpisodes', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'PodcastEpisodes', rawResult, context)
});


export { createFunction as createPodcastEpisode, updateFunction as updatePodcastEpisode };


export const graphqlPodcastEpisodeTypeDefs = gql`
  input CreatePodcastEpisodeDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreatePodcastEpisodeInput {
    data: CreatePodcastEpisodeDataInput!
  }
  
  input UpdatePodcastEpisodeDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdatePodcastEpisodeInput {
    selector: SelectorInput!
    data: UpdatePodcastEpisodeDataInput!
  }
  
  type PodcastEpisodeOutput {
    data: PodcastEpisode
  }

  extend type Mutation {
    createPodcastEpisode(data: CreatePodcastEpisodeDataInput!): PodcastEpisodeOutput
    updatePodcastEpisode(selector: SelectorInput!, data: UpdatePodcastEpisodeDataInput!): PodcastEpisodeOutput
  }
`;
