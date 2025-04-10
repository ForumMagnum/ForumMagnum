
import schema from "@/lib/collections/elicitQuestionPredictions/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createElicitQuestionPrediction({ data }: { data: Partial<DbElicitQuestionPrediction> }, context: ResolverContext) {
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

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ElicitQuestionPredictions', documentWithId);

  return documentWithId;
}

export async function updateElicitQuestionPrediction({ selector, data }: { selector: SelectorInput, data: Partial<DbElicitQuestionPrediction> }, context: ResolverContext) {
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

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ElicitQuestionPredictions', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: ElicitQuestionPredictions, oldDocument, data: origData });

  return updatedDocument;
}


