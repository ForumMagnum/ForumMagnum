
import schema from "@/lib/collections/elicitQuestions/newSchema";
import { accessFilterSingle } from "@/lib/utils/schemaUtils";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getCreatableGraphQLFields, getUpdatableGraphQLFields } from "@/server/vulcan-lib/apollo-server/initGraphQL";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import gql from "graphql-tag";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";

// Collection has custom newCheck

// Collection has custom editCheck

const { createFunction, updateFunction } = getDefaultMutationFunctions('ElicitQuestions', {
  createFunction: async (data, context) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('ElicitQuestions', {
      context,
      data,
      newCheck,
      schema,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ElicitQuestions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ElicitQuestions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    // There are some fields that users who have permission to create a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ElicitQuestions', documentWithId, context);

    return filteredReturnValue;
  },

  updateFunction: async (selector, data, context) => {
    const { currentUser, ElicitQuestions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: elicitquestionSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('ElicitQuestions', { selector, context, data, editCheck, schema });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, ElicitQuestions, elicitquestionSelector, context) ?? previewDocument as DbElicitQuestion;

    await runCountOfReferenceCallbacks({
      collectionName: 'ElicitQuestions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ElicitQuestions, oldDocument, data: origData });

    // There are some fields that users who have permission to edit a document don't have permission to read.
    const filteredReturnValue = await accessFilterSingle(currentUser, 'ElicitQuestions', updatedDocument, context);

    return filteredReturnValue;
  },
});


export { createFunction as createElicitQuestion, updateFunction as updateElicitQuestion };


export const graphqlElicitQuestionTypeDefs = gql`
  input CreateElicitQuestionInput {
    data: {
      ${getCreatableGraphQLFields(schema, '      ')}
    }
  }
  
  input UpdateElicitQuestionInput {
    selector: SelectorInput
    data: {
      ${getUpdatableGraphQLFields(schema, '      ')}
    }
  }
  
  extend type Mutation {
    createElicitQuestion(input: CreateElicitQuestionInput!): ElicitQuestion
    updateElicitQuestion(input: UpdateElicitQuestionInput!): ElicitQuestion
  }
`;
