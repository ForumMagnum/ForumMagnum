
import { userCanUseTags } from "@/lib/betas";
import schema from "@/lib/collections/userTagRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, userTagRel: CreateUserTagRelDataInput | null) {
  return userCanUseTags(user);
}

function editCheck(user: DbUser | null, userTagRel: DbUserTagRel | null) {
  return userCanUseTags(user);
}

const { createFunction, updateFunction } = getDefaultMutationFunctions('UserTagRels', {
  createFunction: async ({ data }: CreateUserTagRelInput, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('UserTagRels', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

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

  updateFunction: async ({ selector, data }: UpdateUserTagRelInput, context) => {
    const { currentUser, UserTagRels } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: usertagrelSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('UserTagRels', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, UserTagRels, usertagrelSelector, context);

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

export const createUserTagRelGqlMutation = makeGqlCreateMutation('UserTagRels', createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserTagRels', rawResult, context)
});

export const updateUserTagRelGqlMutation = makeGqlUpdateMutation('UserTagRels', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'UserTagRels', rawResult, context)
});


export { createFunction as createUserTagRel, updateFunction as updateUserTagRel };


export const graphqlUserTagRelTypeDefs = gql`
  input CreateUserTagRelDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateUserTagRelInput {
    data: CreateUserTagRelDataInput!
  }
  
  input UpdateUserTagRelDataInput {
    ${getUpdatableGraphQLFields(schema)}
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
