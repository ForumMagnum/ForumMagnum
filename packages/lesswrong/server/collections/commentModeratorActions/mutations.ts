import schema from "@/lib/collections/commentModeratorActions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateCommentModeratorActionDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbCommentModeratorAction | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


export async function createCommentModeratorAction({ data }: CreateCommentModeratorActionInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('CommentModeratorActions', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'CommentModeratorActions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('CommentModeratorActions', documentWithId);

  return documentWithId;
}

export async function updateCommentModeratorAction({ selector, data }: UpdateCommentModeratorActionInput, context: ResolverContext) {
  const { currentUser, CommentModeratorActions } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: commentmoderatoractionSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('CommentModeratorActions', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, CommentModeratorActions, commentmoderatoractionSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('CommentModeratorActions', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: CommentModeratorActions, oldDocument, data: origData }));

  return updatedDocument;
}

export const createCommentModeratorActionGqlMutation = makeGqlCreateMutation('CommentModeratorActions', createCommentModeratorAction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CommentModeratorActions', rawResult, context)
});

export const updateCommentModeratorActionGqlMutation = makeGqlUpdateMutation('CommentModeratorActions', updateCommentModeratorAction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CommentModeratorActions', rawResult, context)
});




export const graphqlCommentModeratorActionTypeDefs = gql`
  input CreateCommentModeratorActionDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateCommentModeratorActionInput {
    data: CreateCommentModeratorActionDataInput!
  }
  
  input UpdateCommentModeratorActionDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateCommentModeratorActionInput {
    selector: SelectorInput!
    data: UpdateCommentModeratorActionDataInput!
  }
  
  type CommentModeratorActionOutput {
    data: CommentModeratorAction
  }

  extend type Mutation {
    createCommentModeratorAction(data: CreateCommentModeratorActionDataInput!): CommentModeratorActionOutput
    updateCommentModeratorAction(selector: SelectorInput!, data: UpdateCommentModeratorActionDataInput!): CommentModeratorActionOutput
  }
`;
