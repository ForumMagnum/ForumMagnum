
import schema from "@/lib/collections/forumEvents/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { createInitialRevisionsForEditableFields, reuploadImagesIfEditableFieldsChanged, uploadImagesInEditableFields, notifyUsersOfNewPingbackMentions, createRevisionsForEditableFields, updateRevisionsDocumentIds } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateForumEventDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbForumEvent | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ForumEvents', {
  createFunction: async ({ data }: CreateForumEventInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ForumEvents', {
      context,
      data,
      schema,
      skipValidation,
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

    await runCountOfReferenceCallbacks({
      collectionName: 'ForumEvents',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

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
  },

  updateFunction: async ({ selector, data }: UpdateForumEventInput, context, skipValidation?: boolean) => {
    const { currentUser, ForumEvents } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: forumeventSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ForumEvents', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await createRevisionsForEditableFields({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ForumEvents, forumeventSelector, context) ?? previewDocument as DbForumEvent;

    updatedDocument = await notifyUsersOfNewPingbackMentions({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'ForumEvents',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await reuploadImagesIfEditableFieldsChanged({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ForumEvents, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ForumEvents', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('ForumEvents', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ForumEvents', rawResult, context)
});


export { createFunction as createForumEvent, updateFunction as updateForumEvent };
export { wrappedCreateFunction as createForumEventMutation, wrappedUpdateFunction as updateForumEventMutation };


export const graphqlForumEventTypeDefs = gql`
  input CreateForumEventDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateForumEventInput {
    data: CreateForumEventDataInput!
  }
  
  input UpdateForumEventDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
