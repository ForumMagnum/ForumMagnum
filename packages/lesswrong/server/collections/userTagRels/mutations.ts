
import { userCanUseTags } from "@/lib/betas";
import schema from "@/lib/collections/userTagRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, userTagRel: CreateUserTagRelDataInput | null) {
  return userCanUseTags(user);
}

function editCheck(user: DbUser | null, userTagRel: DbUserTagRel | null) {
  return userCanUseTags(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('UserTagRels', {
  createFunction: async ({ data }: CreateUserTagRelInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('UserTagRels', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'UserTagRels', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserTagRels',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateUserTagRelInput, context, skipValidation?: boolean) => {
    const { currentUser, UserTagRels } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: usertagrelSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('UserTagRels', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, UserTagRels, usertagrelSelector, context) ?? previewDocument as DbUserTagRel;

    await runCountOfReferenceCallbacks({
      collectionName: 'UserTagRels',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: UserTagRels, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserTagRels', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('UserTagRels', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserTagRels', rawResult, context)
});


export { createFunction as createUserTagRel, updateFunction as updateUserTagRel };
export { wrappedCreateFunction as createUserTagRelMutation, wrappedUpdateFunction as updateUserTagRelMutation };


export const graphqlUserTagRelTypeDefs = gql`
  input CreateUserTagRelDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateUserTagRelInput {
    data: CreateUserTagRelDataInput!
  }
  
  input UpdateUserTagRelDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateUserTagRelInput {
    selector: SelectorInput!
    data: UpdateUserTagRelDataInput!
  }
  
  type UserTagRelOutput {
    data: UserTagRel
  }

  extend type Mutation {
    createUserTagRel(data: CreateUserTagRelDataInput!): UserTagRelOutput
    updateUserTagRel(selector: SelectorInput!, data: UpdateUserTagRelDataInput!): UserTagRelOutput
  }
`;
