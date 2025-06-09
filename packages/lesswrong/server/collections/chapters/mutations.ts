
import schema from "@/lib/collections/chapters/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { canonizeChapterPostInfo, notifyUsersOfNewPosts, updateSequenceLastUpdated } from "@/server/callbacks/chapterCallbacks";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

async function newCheck(user: DbUser|null, document: DbChapter|null, context: ResolverContext) {
  const { Sequences } = context;
  if (!user || !document) return false;
  let parentSequence = await Sequences.findOne({_id: document.sequenceId});
  if (!parentSequence) return false
  return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.new.own') : userCanDo(user, `chapters.new.all`)
}

async function editCheck(user: DbUser|null, document: DbChapter|null, context: ResolverContext) {
  const { Sequences } = context;
  if (!user || !document) return false;
  let parentSequence = await Sequences.findOne({_id: document.sequenceId});
  if (!parentSequence) return false
  return userOwns(user, parentSequence) ? userCanDo(user, 'chapters.edit.own') : userCanDo(user, `chapters.edit.all`)
}

export async function createChapter({ data }: CreateChapterInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Chapters', {
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

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Chapters', callbackProps);
  let documentWithId = afterCreateProperties.document;

  documentWithId = await updateRevisionsDocumentIds({
    newDoc: documentWithId,
    props: afterCreateProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Chapters', documentWithId);

  const asyncProperties = {
    ...afterCreateProperties,
    document: documentWithId,
    newDocument: documentWithId,
  };

  await canonizeChapterPostInfo(documentWithId, context);

  await uploadImagesInEditableFields({
    newDoc: documentWithId,
    props: asyncProperties,
  });

  return documentWithId;
}

export async function updateChapter({ selector, data }: UpdateChapterInput, context: ResolverContext) {
  const { currentUser, Chapters } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: chapterSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Chapters', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  data = await createRevisionsForEditableFields({
    docData: data,
    props: updateCallbackProperties,
  });

  let updatedDocument = await updateAndReturnDocument(data, Chapters, chapterSelector, context);

  updatedDocument = await notifyUsersOfNewPingbackMentions({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Chapters', updatedDocument, oldDocument);

  await updateSequenceLastUpdated(updateCallbackProperties);
  await notifyUsersOfNewPosts(updateCallbackProperties);

  await canonizeChapterPostInfo(updatedDocument, context);

  await reuploadImagesIfEditableFieldsChanged({
    newDoc: updatedDocument,
    props: updateCallbackProperties,
  });

  void logFieldChanges({ currentUser, collection: Chapters, oldDocument, data: origData });

  return updatedDocument;
}

export const createChapterGqlMutation = makeGqlCreateMutation('Chapters', createChapter, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Chapters', rawResult, context)
});

export const updateChapterGqlMutation = makeGqlUpdateMutation('Chapters', updateChapter, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Chapters', rawResult, context)
});




export const graphqlChapterTypeDefs = gql`
  input CreateChapterDataInput ${
    getCreatableGraphQLFields(schema)
  }

  input CreateChapterInput {
    data: CreateChapterDataInput!
  }
  
  input UpdateChapterDataInput ${
    getUpdatableGraphQLFields(schema)
  }

  input UpdateChapterInput {
    selector: SelectorInput!
    data: UpdateChapterDataInput!
  }
  
  type ChapterOutput {
    data: Chapter
  }

  extend type Mutation {
    createChapter(data: CreateChapterDataInput!): ChapterOutput
    updateChapter(selector: SelectorInput!, data: UpdateChapterDataInput!): ChapterOutput
  }
`;
