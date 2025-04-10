
import schema from "@/lib/collections/dialogueChecks/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createDialogueCheck({ data }: { data: Partial<DbDialogueCheck> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('DialogueChecks', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'DialogueChecks', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('DialogueChecks', documentWithId);

  return documentWithId;
}

export async function updateDialogueCheck({ selector, data }: { data: Partial<DbDialogueCheck>, selector: SelectorInput }, context: ResolverContext) {
  const { currentUser, DialogueChecks } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: dialoguecheckSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('DialogueChecks', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, DialogueChecks, dialoguecheckSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('DialogueChecks', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: DialogueChecks, oldDocument, data: origData });

  return updatedDocument;
}


