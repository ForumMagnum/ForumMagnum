
import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { userIsAdmin } from "@/lib/vulcan-users/permissions";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/graphqlTemplates";
import { wrapCreateMutatorFunction, wrapUpdateMutatorFunction } from "@/server/vulcan-lib/apollo-server/helpers";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";


function newCheck(user: DbUser | null, document: CreateArbitalTagContentRelDataInput | null, context: ResolverContext) {
  return userIsAdmin(user);
}

function editCheck(user: DbUser | null, document: DbArbitalTagContentRel | null, context: ResolverContext) {
  if (!user || !document) return false;

  return userIsAdmin(user);
}


const { createFunction, updateFunction } = getDefaultMutationFunctions('ArbitalTagContentRels', {
  createFunction: async ({ data }: CreateArbitalTagContentRelInput, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ArbitalTagContentRels', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ArbitalTagContentRels', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ArbitalTagContentRels',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: UpdateArbitalTagContentRelInput, context, skipValidation?: boolean) => {
    const { currentUser, ArbitalTagContentRels } = context;

    const {
      documentSelector: arbitaltagcontentrelSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ArbitalTagContentRels', { selector, context, data, schema, skipValidation });

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ArbitalTagContentRels, arbitaltagcontentrelSelector, context) ?? previewDocument as DbArbitalTagContentRel;

    await runCountOfReferenceCallbacks({
      collectionName: 'ArbitalTagContentRels',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});

const wrappedCreateFunction = wrapCreateMutatorFunction(createFunction, {
  newCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ArbitalTagContentRels', rawResult, context)
});

const wrappedUpdateFunction = wrapUpdateMutatorFunction('ArbitalTagContentRels', updateFunction, {
  editCheck,
  accessFilter: (rawResult, context) => accessFilterSingle(context.currentUser, 'ArbitalTagContentRels', rawResult, context)
});


export { createFunction as createArbitalTagContentRel, updateFunction as updateArbitalTagContentRel };
export { wrappedCreateFunction as createArbitalTagContentRelMutation, wrappedUpdateFunction as updateArbitalTagContentRelMutation };


export const graphqlArbitalTagContentRelTypeDefs = gql`
  input CreateArbitalTagContentRelDataInput {
    ${getCreatableGraphQLFields(schema, '    ')}
  }

  input CreateArbitalTagContentRelInput {
    data: CreateArbitalTagContentRelDataInput!
  }
  
  input UpdateArbitalTagContentRelDataInput {
    ${getUpdatableGraphQLFields(schema, '    ')}
  }

  input UpdateArbitalTagContentRelInput {
    selector: SelectorInput!
    data: UpdateArbitalTagContentRelDataInput!
  }
  
  extend type Mutation {
    createArbitalTagContentRel(input: CreateArbitalTagContentRelInput!): ArbitalTagContentRel
    updateArbitalTagContentRel(selector: SelectorInput!, data: UpdateArbitalTagContentRelDataInput!): ArbitalTagContentRel
  }
`;
