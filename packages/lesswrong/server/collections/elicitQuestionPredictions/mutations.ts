
import schema from "@/lib/collections/elicitQuestionPredictions/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


const { createFunction, updateFunction } = getDefaultMutationFunctions('ElicitQuestionPredictions', {
  createFunction: async ({ data }: { data: Partial<DbElicitQuestionPrediction> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('ElicitQuestionPredictions', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ElicitQuestionPredictions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ElicitQuestionPredictions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbElicitQuestionPrediction> }, context) => {
    const { currentUser, ElicitQuestionPredictions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: elicitquestionpredictionSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('ElicitQuestionPredictions', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, ElicitQuestionPredictions, elicitquestionpredictionSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'ElicitQuestionPredictions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ElicitQuestionPredictions, oldDocument, data: origData });

    return updatedDocument;
  }
});


export { createFunction as createElicitQuestionPrediction, updateFunction as updateElicitQuestionPrediction };
