
import schema from "@/lib/collections/llmMessages/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createLlmMessage({ data }: { data: Partial<DbLlmMessage> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('LlmMessages', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'LlmMessages', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('LlmMessages', documentWithId);

  return documentWithId;
}

export async function updateLlmMessage({ selector, data }: { selector: SelectorInput, data: Partial<DbLlmMessage> }, context: ResolverContext) {
  const { currentUser, LlmMessages } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: llmmessageSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('LlmMessages', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, LlmMessages, llmmessageSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('LlmMessages', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: LlmMessages, oldDocument, data: origData });

  return updatedDocument;
}


