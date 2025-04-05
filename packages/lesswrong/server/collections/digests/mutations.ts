
import schema from "@/lib/collections/digests/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { backdatePreviousDigest, createNextDigestOnPublish } from "@/server/callbacks/digestCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


function newCheck(user: DbUser | null, document: CreateDigestDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbDigest | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('Digests', {
  createFunction: async ({ data }: CreateDigestInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('Digests', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Digests', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'Digests',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateDigestInput, context, skipValidation?: boolean) => {
    const { currentUser, Digests } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: digestSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('Digests', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, Digests, digestSelector, context) ?? previewDocument as DbDigest;

    await runCountOfReferenceCallbacks({
      collectionName: 'Digests',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    await createNextDigestOnPublish(updateCallbackProperties);
    await backdatePreviousDigest(updateCallbackProperties);

    void logFieldChanges({ currentUser, collection: Digests, oldDocument, data: origData });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Digests', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('Digests', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'Digests', rawResult, context)
});


export { createFunction as createDigest, updateFunction as updateDigest };
export { wrappedCreateFunction as createDigestMutation, wrappedUpdateFunction as updateDigestMutation };


export const graphqlDigestTypeDefs = gql`
  input CreateDigestDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateDigestInput {
    data: CreateDigestDataInput!
  }
  
  input UpdateDigestDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateDigestInput {
    selector: SelectorInput!
    data: UpdateDigestDataInput!
  }
  
  type DigestOutput {
    data: Digest
  }

  extend type Mutation {
    createDigest(data: CreateDigestDataInput!): DigestOutput
    updateDigest(selector: SelectorInput!, data: UpdateDigestDataInput!): DigestOutput
  }
`;
