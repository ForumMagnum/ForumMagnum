
import schema from "@/lib/collections/sideCommentCaches/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";


function newCheck(user: DbUser | null, document: Partial<DbInsertion<DbSideCommentCache>> | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbSideCommentCache | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('SideCommentCaches', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('SideCommentCaches', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'SideCommentCaches', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'SideCommentCaches',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'SideCommentCaches', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, SideCommentCaches } = context;

    const {
      documentSelector: sidecommentcacheSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('SideCommentCaches', { selector, context, data, editCheck, schema });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, SideCommentCaches, sidecommentcacheSelector, context) ?? previewDocument as DbSideCommentCache;

    await runCountOfReferenceCallbacks({
      collectionName: 'SideCommentCaches',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'SideCommentCaches', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createSideCommentCache, updateFunction as updateSideCommentCache };


export const graphqlSideCommentCacheTypeDefs = gql`
  input CreateSideCommentCacheInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateSideCommentCacheInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createSideCommentCache(input: CreateSideCommentCacheInput!): SideCommentCache
    updateSideCommentCache(input: UpdateSideCommentCacheInput!): SideCommentCache
  }
`;
