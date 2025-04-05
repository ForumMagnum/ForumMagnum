
import { userCanCreateTags } from "@/lib/betas";
import { tagUserHasSufficientKarma } from "@/lib/collections/tags/helpers";
import schema from "@/lib/collections/tags/newSchema";
import { isElasticEnabled } from "@/lib/instanceSettings";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { cascadeSoftDeleteToTagRels, reexportProfileTagUsersToElastic, updateParentTagSubTagIds, validateTagCreate, validateTagUpdate } from "@/server/callbacks/tagCallbackFunctions";
import { runCreateAfterEditableCallbacks, runCreateBeforeEditableCallbacks, runEditAsyncEditableCallbacks, runNewAsyncEditableCallbacks, runUpdateAfterEditableCallbacks, runUpdateBeforeEditableCallbacks } from "@/server/editor/make_editable_callbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { elasticSyncDocument } from "@/server/search/elastic/elasticCallbacks";
import { runSlugCreateBeforeCallback, runSlugUpdateBeforeCallback } from "@/server/utils/slugUtil";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, tag: CreateTagDataInput | null) {
  if (!user) return false;
  if (user.deleted) return false;

  if (!user.isAdmin) {  // skip further checks for admins
    if (!tagUserHasSufficientKarma(user, "new")) return false
  }
  return userCanCreateTags(user);
}

function editCheck(user: DbUser | null, tag: DbTag | null) {
  if (!user) return false;
  if (user.deleted) return false;

  if (!user.isAdmin) {  // skip further checks for admins
    // If canEditUserIds is set only those users can edit the tag
    const restricted = tag && tag.canEditUserIds
    if (restricted && !tag.canEditUserIds?.includes(user._id)) return false;
    if (!restricted && !tagUserHasSufficientKarma(user, "edit")) return false
  }
  return userCanCreateTags(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('Tags', {
  createFunction: async ({ data }: CreateTagInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Tags', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    await validateTagCreate(callbackProps);

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    data = await runSlugCreateBeforeCallback(callbackProps);

    data = await runCreateBeforeEditableCallbacks({
      doc: data,
      props: callbackProps,
    });

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Tags', callbackProps);
    let documentWithId = afterCreateProperties.document;

    documentWithId = await runCreateAfterEditableCallbacks({
      newDoc: documentWithId,
      props: afterCreateProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Tags',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    const asyncProperties = {
      ...afterCreateProperties,
      document: documentWithId,
      newDocument: documentWithId,
    };

    if (isElasticEnabled) {
      void elasticSyncDocument('Tags', documentWithId._id);
    }

    await runNewAsyncEditableCallbacks({
      newDoc: documentWithId,
      props: asyncProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateTagInput, context, skipValidation?: boolean) => {
    const { currentUser, Tags } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: tagSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Tags', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    await validateTagUpdate(updateCallbackProperties);

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    data = await runSlugUpdateBeforeCallback(updateCallbackProperties);

    data = await runUpdateBeforeEditableCallbacks({
      docData: data,
      props: updateCallbackProperties,
    });

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Tags, tagSelector, context) ?? previewDocument as DbTag;

    updatedDocument = await cascadeSoftDeleteToTagRels(updatedDocument, updateCallbackProperties);
    updatedDocument = await updateParentTagSubTagIds(updatedDocument, updateCallbackProperties);
    updatedDocument = await reexportProfileTagUsersToElastic(updatedDocument, updateCallbackProperties);

    updatedDocument = await runUpdateAfterEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    await runCountOfReferenceCallbacks({
      collectionName: 'Tags',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await runEditAsyncEditableCallbacks({
      newDoc: updatedDocument,
      props: updateCallbackProperties,
    });

    if (isElasticEnabled) {
      void elasticSyncDocument('Tags', updatedDocument._id);
    }

    void logFieldChanges({ currentUser, collection: Tags, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Tags', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Tags', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Tags', rawResult, context)
});


export { createFunction as createTag, updateFunction as updateTag };
export { wrappedCreateFunction as createTagMutation, wrappedUpdateFunction as updateTagMutation };


export const graphqlTagTypeDefs = gql`
  input CreateTagDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateTagInput {
    data: CreateTagDataInput!
  }
  
  input UpdateTagDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateTagInput {
    selector: SelectorInput!
    data: UpdateTagDataInput!
  }
  
  extend type Mutation {
    createTag(input: CreateTagInput!): Tag
    updateTag(selector: SelectorInput!, data: UpdateTagDataInput!): Tag
  }
`;
