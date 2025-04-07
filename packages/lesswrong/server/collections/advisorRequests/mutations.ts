
import schema from "@/lib/collections/advisorRequests/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
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


function newCheck(user: DbUser | null, document: CreateAdvisorRequestDataInput | null, context: ResolverContext) {
  return userCanDo(user, [
    'advisorrequest.create',
    'advisorrequests.new',
  ]);
}

function editCheck(user: DbUser | null, document: DbAdvisorRequest | null, context: ResolverContext) {
  if (!user || !document) return false;

  // If we have legacy action permissions defined
  // for this collection, check if user can perform
  // the current action based on whether they own the
  // document or not.  Otherwise, check if user is an
  // admin.
  return userOwns(user, document as HasUserIdType)
    ? userCanDo(user, [
      'advisorrequest.update.own',
      'advisorrequests.edit.own',
    ])
    : userCanDo(user, [
      'advisorrequest.update.all',
      'advisorrequests.edit.all',
    ]);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('AdvisorRequests', {
  createFunction: async ({ data }: CreateAdvisorRequestInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('AdvisorRequests', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'AdvisorRequests', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'AdvisorRequests',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateAdvisorRequestInput, context, skipValidation?: boolean) => {
    const { currentUser, AdvisorRequests } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: advisorrequestSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('AdvisorRequests', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, AdvisorRequests, advisorrequestSelector, context) ?? previewDocument as DbAdvisorRequest;

    await runCountOfReferenceCallbacks({
      collectionName: 'AdvisorRequests',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: AdvisorRequests, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = makeGqlCreateMutation(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'AdvisorRequests', rawResult, context)
});

const wrappedUpdateFunction = makeGqlUpdateMutation('AdvisorRequests', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'AdvisorRequests', rawResult, context)
});


export { createFunction as createAdvisorRequest, updateFunction as updateAdvisorRequest };
export { wrappedCreateFunction as createAdvisorRequestMutation, wrappedUpdateFunction as updateAdvisorRequestMutation };

export const graphqlAdvisorRequestTypeDefs = gql`
  input CreateAdvisorRequestDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateAdvisorRequestInput {
    data: CreateAdvisorRequestDataInput!
  }
  
  input UpdateAdvisorRequestDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateAdvisorRequestInput {
    selector: SelectorInput!
    data: UpdateAdvisorRequestDataInput!
  }
  
  type AdvisorRequestOutput {
    data: AdvisorRequest
  }

  extend type Mutation {
    createAdvisorRequest(data: CreateAdvisorRequestDataInput!): AdvisorRequestOutput
    updateAdvisorRequest(selector: SelectorInput!, data: UpdateAdvisorRequestDataInput!): AdvisorRequestOutput
  }
`;
