
import schema from "@/lib/collections/commentModeratorActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateCommentModeratorActionDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbCommentModeratorAction | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('CommentModeratorActions', {
  createFunction: async ({ data }: CreateCommentModeratorActionInput, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('CommentModeratorActions', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'CommentModeratorActions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'CommentModeratorActions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'CommentModeratorActions', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdateCommentModeratorActionInput, context) => {
    const { currentUser, CommentModeratorActions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: commentmoderatoractionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('CommentModeratorActions', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, CommentModeratorActions, commentmoderatoractionSelector, context) ?? previewDocument as DbCommentModeratorAction;

    await runCountOfReferenceCallbacks({
      collectionName: 'CommentModeratorActions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: CommentModeratorActions, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'CommentModeratorActions', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createCommentModeratorAction, updateFunction as updateCommentModeratorAction };


export const graphqlCommentModeratorActionTypeDefs = gql`
  input CreateCommentModeratorActionDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateCommentModeratorActionInput {
    data: CreateCommentModeratorActionDataInput!
  }
  
  input UpdateCommentModeratorActionDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateCommentModeratorActionInput {
    selector: SelectorInput!
    data: UpdateCommentModeratorActionDataInput!
  }
  
  extend type Mutation {
    createCommentModeratorAction(input: CreateCommentModeratorActionInput!): CommentModeratorAction
    updateCommentModeratorAction(input: UpdateCommentModeratorActionInput!): CommentModeratorAction
  }
`;
