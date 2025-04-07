
import { userCanUseTags } from "@/lib/betas";
import schema from "@/lib/collections/tagRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { taggedPostNewNotifications, validateTagRelCreate, voteForTagWhenCreated } from "@/server/callbacks/tagCallbackFunctions";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";

function newCheck(user: DbUser | null, tag: CreateTagRelDataInput | null) {
  return userCanUseTags(user);
}

function editCheck(user: DbUser | null, tag: DbTagRel | null) {
  return userCanUseTags(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('TagRels', {
  createFunction: async ({ data }: CreateTagRelInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('TagRels', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    await validateTagRelCreate(data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'TagRels', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'TagRels',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    documentWithId = await voteForTagWhenCreated(documentWithId, afterCreateProperties);

    await taggedPostNewNotifications(documentWithId, afterCreateProperties);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateTagRelInput, context, skipValidation?: boolean) => {
    const { currentUser, TagRels } = context;

    const {
      documentSelector: tagrelSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('TagRels', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, TagRels, tagrelSelector, context) ?? previewDocument as DbTagRel;

    await runCountOfReferenceCallbacks({
      collectionName: 'TagRels',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'TagRels', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('TagRels', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'TagRels', rawResult, context)
});


export { createFunction as createTagRel, updateFunction as updateTagRel };
export { wrappedCreateFunction as createTagRelMutation, wrappedUpdateFunction as updateTagRelMutation };


export const graphqlTagRelTypeDefs = gql`
  input CreateTagRelDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateTagRelInput {
    data: CreateTagRelDataInput!
  }
  
  input UpdateTagRelDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateTagRelInput {
    selector: SelectorInput!
    data: UpdateTagRelDataInput!
  }
  
  type TagRelOutput {
    data: TagRel
  }

  extend type Mutation {
    createTagRel(data: CreateTagRelDataInput!): TagRelOutput
    updateTagRel(selector: SelectorInput!, data: UpdateTagRelDataInput!): TagRelOutput
  }
`;
