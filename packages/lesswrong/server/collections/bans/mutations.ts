
import schema from "@/lib/collections/bans/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
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
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Bans', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Bans, banSelector, context) ?? previewDocument as DbBan;

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

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Bans', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Bans', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Bans', rawResult, context)
});


export { createFunction as createBan, updateFunction as updateBan };
export { wrappedCreateFunction as createBanMutation, wrappedUpdateFunction as updateBanMutation };


export const graphqlBanTypeDefs = gql`
  input CreateBanDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateBanInput {
    data: CreateBanDataInput!
  }
  
  input UpdateBanDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
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
