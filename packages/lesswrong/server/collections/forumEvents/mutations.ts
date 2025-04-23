
import schema from "@/lib/collections/forumEvents/newSchema";
import { canUserEditPostMetadata, userIsPostGroupOrganizer } from "@/lib/collections/posts/helpers";
import { userCanPost } from "@/lib/collections/users/helpers";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin, userIsPodcaster } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateForumEventDataInput | null, context: ResolverContext) {
  if (!user || !document) return false;

  if (userIsAdmin(user)) return true;

  return !document?.isGlobal && userCanPost(user);
}

async function editCheck(user: DbUser | null, document: DbForumEvent | null, context: ResolverContext) {
  if (!user || !document) return false;

  if (userIsAdmin(user)) return true;

  const { postId } = document;
  const post = postId && (await context.loaders.Posts.load(postId));

  if (!post) return false;

  return canUserEditPostMetadata(user, post) || userIsPodcaster(user) || await userIsPostGroupOrganizer(user, post, context)
}


export async function createForumEvent({ data }: CreateForumEventInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ForumEvents', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ForumEvents', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ForumEvents', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateForumEvent({ selector, data }: UpdateForumEventInput, context: ResolverContext) {
  const { currentUser, ForumEvents } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: forumeventSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ForumEvents', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, ForumEvents, forumeventSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ForumEvents', updatedDocument, oldDocument);

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  void logFieldChanges({ currentUser, collection: ForumEvents, oldDocument, data: origData });

  return updatedDocument;
}

export const createForumEventGqlMutation = makeGqlCreateMutation('ForumEvents', createForumEvent, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ForumEvents', rawResult, context)
});

export const updateForumEventGqlMutation = makeGqlUpdateMutation('ForumEvents', updateForumEvent, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ForumEvents', rawResult, context)
});




export const graphqlForumEventTypeDefs = gql`
  input CreateForumEventDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateForumEventInput {
    data: CreateForumEventDataInput!
  }
  
  input UpdateForumEventDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateForumEventInput {
    selector: SelectorInput!
    data: UpdateForumEventDataInput!
  }
  
  type ForumEventOutput {
    data: ForumEvent
  }

  extend type Mutation {
    createForumEvent(data: CreateForumEventDataInput!): ForumEventOutput
    updateForumEvent(selector: SelectorInput!, data: UpdateForumEventDataInput!): ForumEventOutput
  }
`;
