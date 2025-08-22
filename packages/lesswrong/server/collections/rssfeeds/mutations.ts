import schema from "@/lib/collections/rssfeeds/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { populateRawFeed } from "@/server/rss-integration/callbacks";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
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

export async function createRSSFeed({ data }: CreateRSSFeedInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('RSSFeeds', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await populateRawFeed(data);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'RSSFeeds', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('RSSFeeds', documentWithId);

  return documentWithId;
}

export async function updateRSSFeed({ selector, data }: UpdateRSSFeedInput, context: ResolverContext) {
  const { currentUser, RSSFeeds } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: rssfeedSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('RSSFeeds', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, RSSFeeds, rssfeedSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('RSSFeeds', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: RSSFeeds, oldDocument, data: origData }));

  return updatedDocument;
}

export const createRSSFeedGqlMutation = makeGqlCreateMutation('RSSFeeds', createRSSFeed, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RSSFeeds', rawResult, context)
});

export const updateRSSFeedGqlMutation = makeGqlUpdateMutation('RSSFeeds', updateRSSFeed, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'RSSFeeds', rawResult, context)
});




export const graphqlRSSFeedTypeDefs = gql`
  input CreateRSSFeedDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateRSSFeedInput {
    data: CreateRSSFeedDataInput!
  }
  
  input UpdateRSSFeedDataInput ${
    getUpdatableGraphQLFields(schema)
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
