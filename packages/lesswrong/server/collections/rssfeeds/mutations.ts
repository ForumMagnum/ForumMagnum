
import schema from "@/lib/collections/rssfeeds/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { populateRawFeed } from "@/server/rss-integration/callbacks";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
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
      newCheck,
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
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('RSSFeeds', { selector, context, data, editCheck, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, RSSFeeds, rssfeedSelector, context) ?? previewDocument as DbRSSFeed;

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

const wrappedCreateFunction = wrapMutatorFunction(createFunction, (rawResult, context) => accessFilterSingle(context.currentUser, 'RSSFeeds', rawResult, context));
const wrappedUpdateFunction = wrapMutatorFunction(updateFunction, (rawResult, context) => accessFilterSingle(context.currentUser, 'RSSFeeds', rawResult, context));

export { createFunction as createRSSFeed, updateFunction as updateRSSFeed };
export { wrappedCreateFunction as createRSSFeedMutation, wrappedUpdateFunction as updateRSSFeedMutation };


export const graphqlRSSFeedTypeDefs = gql`
  input CreateRSSFeedDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateRSSFeedInput {
    data: CreateRSSFeedDataInput!
  }
  
  input UpdateRSSFeedDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateRSSFeedInput {
    selector: SelectorInput!
    data: UpdateRSSFeedDataInput!
  }
  
  extend type Mutation {
    createRSSFeed(input: CreateRSSFeedInput!): RSSFeed
    updateRSSFeed(input: UpdateRSSFeedInput!): RSSFeed
  }
`;
