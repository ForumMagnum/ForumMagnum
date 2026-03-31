import schema from "@/lib/collections/curationNotices/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdminOrMod } from "@/lib/vulcan-users/permissions";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import { postGetPageUrl } from "@/lib/collections/posts/helpers";
import { htmlToTextDefault } from "@/lib/htmlToText";
import { captureException } from "@/lib/sentryWrapper";
import { postMessage } from "@/server/slack/client";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateCurationNoticeDataInput | null) {
  return userIsAdminOrMod(user)
}

function editCheck(user: DbUser | null, document: DbCurationNotice | null) {
  return userIsAdminOrMod(user)
}

async function postCurationNoticeToSlack(document: DbCurationNotice, context: ResolverContext) {
  const post = await context.Posts.findOne({ _id: document.postId });
  if (!post) return;
  const author = await context.loaders.Users.load(document.userId);
  const postUrl = postGetPageUrl(post, { isAbsolute: true });
  const noticeText = document.contents?.html ? htmlToTextDefault(document.contents.html) : '(empty)';
  const lines = [
    `:pencil: *New curation draft* by ${author?.displayName ?? 'Unknown'}`,
    `*Post:* <${postUrl}|${post.title}>`,
    ``,
    noticeText,
  ];
  try {
    await postMessage({ text: lines.join('\n'), channelName: "curation", options: { mrkdwn: true } });
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post to curation Slack channel:', error);
  }
}

async function postCurationPublishToSlack(document: DbCurationNotice, context: ResolverContext) {
  const post = await context.Posts.findOne({ _id: document.postId });
  if (!post) return;
  const author = await context.loaders.Users.load(document.userId);
  const postUrl = postGetPageUrl(post, { isAbsolute: true });
  try {
    await postMessage({
      text: `:tada: *Post curated* by ${author?.displayName ?? 'Unknown'}: <${postUrl}|${post.title}>`,
      channelName: "curation",
      options: { mrkdwn: true },
    });
  } catch (error) {
    captureException(error);
    // eslint-disable-next-line no-console
    console.error('Failed to post to curation Slack channel:', error);
  }
}

export async function createCurationNotice({ data }: CreateCurationNoticeInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('CurationNotices', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  data = await createInitialRevisionsForEditableFields({
    doc: data,
    props: callbackProps,
  });

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'CurationNotices', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('CurationNotices', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  backgroundTask(postCurationNoticeToSlack(documentWithId, context));

  return documentWithId;
}

export async function updateCurationNotice({ selector, data }: UpdateCurationNoticeInput, context: ResolverContext) {
  const { currentUser, CurationNotices } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: curationnoticeSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('CurationNotices', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, CurationNotices, curationnoticeSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('CurationNotices', updatedDocument, oldDocument);

  reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  backgroundTask(logFieldChanges({ currentUser, collection: CurationNotices, oldDocument, data: origData }));

  const wasJustPublished = !oldDocument.commentId && updatedDocument.commentId;
  if (wasJustPublished) {
    backgroundTask(postCurationPublishToSlack(updatedDocument, context));
  }

  return updatedDocument;
}

export const createCurationNoticeGqlMutation = makeGqlCreateMutation('CurationNotices', createCurationNotice, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CurationNotices', rawResult, context)
});

export const updateCurationNoticeGqlMutation = makeGqlUpdateMutation('CurationNotices', updateCurationNotice, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'CurationNotices', rawResult, context)
});




export const graphqlCurationNoticeTypeDefs = gql`
  input CreateCurationNoticeDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateCurationNoticeInput {
    data: CreateCurationNoticeDataInput!
  }
  
  input UpdateCurationNoticeDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateCurationNoticeInput {
    selector: SelectorInput!
    data: UpdateCurationNoticeDataInput!
  }
  
  type CurationNoticeOutput {
    data: CurationNotice
  }

  extend type Mutation {
    createCurationNotice(data: CreateCurationNoticeDataInput!): CurationNoticeOutput
    updateCurationNotice(selector: SelectorInput!, data: UpdateCurationNoticeDataInput!): CurationNoticeOutput
  }
`;
