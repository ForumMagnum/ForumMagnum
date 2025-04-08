
import schema from "@/lib/collections/rssfeeds/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { populateRawFeed } from "@/server/rss-integration/callbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: DbRSSFeed | null) {
  if (!document || !user) return false;
  return userCanDo(user, 'rssfeeds.new.all')
}

function editCheck(user: DbUser | null, document: DbRSSFeed | null) {
  if (!document || !user) return false;
  return userOwns(user, document)
    ? userCanDo(user, 'rssfeeds.edit.own')
    : userCanDo(user, 'rssfeeds.edit.all')
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('RSSFeeds', {
  createFunction: async ({ data }: CreateRSSFeedInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('RSSFeeds', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await populateRawFeed(data);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'RSSFeeds', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'RSSFeeds',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateRSSFeedInput, context, skipValidation?: boolean) => {
    const { currentUser, RSSFeeds } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: rssfeedSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('RSSFeeds', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, RSSFeeds, rssfeedSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'RSSFeeds',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: RSSFeeds, oldDocument, data: origData });

    return updatedDocument;
  },
});

export const createRSSFeedGqlMutation = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RSSFeeds', rawResult, context)
});

export const updateRSSFeedGqlMutation = makeGqlUpdateMutation('RSSFeeds', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RSSFeeds', rawResult, context)
});


export { createFunction as createRSSFeed, updateFunction as updateRSSFeed };


export const graphqlRSSFeedTypeDefs = gql`
  input CreateRSSFeedDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateRSSFeedInput {
    data: CreateRSSFeedDataInput!
  }
  
  input UpdateRSSFeedDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateRSSFeedInput {
    selector: SelectorInput!
    data: UpdateRSSFeedDataInput!
  }
  
  type RSSFeedOutput {
    data: RSSFeed
  }

  extend type Mutation {
    createRSSFeed(data: CreateRSSFeedDataInput!): RSSFeedOutput
    updateRSSFeed(selector: SelectorInput!, data: UpdateRSSFeedDataInput!): RSSFeedOutput
  }
`;
