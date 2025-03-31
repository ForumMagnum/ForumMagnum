
import schema from "@/lib/collections/chapters/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { canonizeChapterPostInfo, notifyUsersOfNewPosts, updateSequenceLastUpdated } from "@/server/callbacks/chapterCallbacks";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
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

const { createFunction, updateFunction } = getDefaultMutationFunctions('Chapters', {
  createFunction: async ({ data }: CreateChapterInput, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Chapters', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Chapters', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Chapters',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    await canonizeChapterPostInfo(documentWithId, context);

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Chapters', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdateChapterInput, context) => {
    const { currentUser, Chapters } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: chapterSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Chapters', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Chapters, chapterSelector, context) ?? previewDocument as DbChapter;

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Chapters',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await updateSequenceLastUpdated(updateCallbackProperties);
    await notifyUsersOfNewPosts(updateCallbackProperties);

    await canonizeChapterPostInfo(updatedDocument, context);

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Chapters, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'Chapters', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createChapter, updateFunction as updateChapter };


export const graphqlChapterTypeDefs = gql`
  input CreateChapterDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateChapterInput {
    data: CreateChapterDataInput!
  }
  
  input UpdateChapterDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateChapterInput {
    selector: SelectorInput!
    data: UpdateChapterDataInput!
  }
  
  extend type Mutation {
    createChapter(input: CreateChapterInput!): Chapter
    updateChapter(input: UpdateChapterInput!): Chapter
  }
`;
