
import schema from "@/lib/collections/advisorRequests/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userCanDo, userOwns } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
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
  createFunction: async ({ data }: CreateAdvisorRequestInput, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('AdvisorRequests', {
      context,
      data,
      newCheck,
      schema,
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

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'AdvisorRequests', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async ({ selector, data }: UpdateAdvisorRequestInput, context) => {
    const { currentUser, AdvisorRequests } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: advisorrequestSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('AdvisorRequests', { selector, context, data, editCheck, schema });

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

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'AdvisorRequests', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createAdvisorRequest, updateFunction as updateAdvisorRequest };

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
  
  extend type Mutation {
    createAdvisorRequest(input: CreateAdvisorRequestInput!): AdvisorRequest
    updateAdvisorRequest(input: UpdateAdvisorRequestInput!): AdvisorRequest
  }
`;
