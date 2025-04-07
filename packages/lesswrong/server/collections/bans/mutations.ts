
import schema from "@/lib/collections/bans/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { makeGqlCreateMutation, makeGqlUpdateMutation } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import gql from "graphql-tag";
import cloneDeep from "lodash/cloneDeep";

function newCheck(user: DbUser | null, document: CreateBanDataInput | null) {
  if (!user || !document) return false;
  return userCanDo(user, 'bans.new');
}

function editCheck(user: DbUser | null, document: DbBan | null) {
  if (!user || !document) return false;
  return userCanDo(user, `bans.edit.all`)
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Bans', {
  createFunction: async ({ data }: CreateBanInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Bans', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Bans', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Bans',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateBanInput, context, skipValidation?: boolean) => {
    const { currentUser, Bans } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: banSelector,
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Bans', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, Bans, banSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'Bans',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: Bans, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Bans', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('Bans', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Bans', rawResult, context)
});


export { createFunction as createBan, updateFunction as updateBan };
export { wrappedCreateFunction as createBanMutation, wrappedUpdateFunction as updateBanMutation };


export const graphqlBanTypeDefs = gql`
  input CreateBanDataInput {
    ${getCreatableGraphQLFields(schema)}
  }

  input CreateBanInput {
    data: CreateBanDataInput!
  }
  
  input UpdateBanDataInput {
    ${getUpdatableGraphQLFields(schema)}
  }

  input UpdateBanInput {
    selector: SelectorInput!
    data: UpdateBanDataInput!
  }
  
  type BanOutput {
    data: Ban
  }

  extend type Mutation {
    createBan(data: CreateBanDataInput!): BanOutput
    updateBan(selector: SelectorInput!, data: UpdateBanDataInput!): BanOutput
  }
`;
