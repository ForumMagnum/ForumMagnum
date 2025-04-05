
import schema from "@/lib/collections/commentModeratorActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
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
  createFunction: async ({ data }: CreateCommentModeratorActionInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('CommentModeratorActions', {
      context,
      data,
      schema,
      skipValidation,
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

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateCommentModeratorActionInput, context, skipValidation?: boolean) => {
    const { currentUser, CommentModeratorActions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: commentmoderatoractionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('CommentModeratorActions', { selector, context, data, schema, skipValidation });

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

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CommentModeratorActions', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('CommentModeratorActions', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CommentModeratorActions', rawResult, context)
});


export { createFunction as createCommentModeratorAction, updateFunction as updateCommentModeratorAction };
export { wrappedCreateFunction as createCommentModeratorActionMutation, wrappedUpdateFunction as updateCommentModeratorActionMutation };


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
    updateCommentModeratorAction(selector: SelectorInput!, data: UpdateCommentModeratorActionDataInput!): CommentModeratorAction
  }
`;
