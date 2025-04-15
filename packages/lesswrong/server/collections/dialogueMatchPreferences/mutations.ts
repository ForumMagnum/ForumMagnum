
import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";

// TODO: deprecate this collection entirely?
export async function createDialogueMatchPreference({ data }: CreateDialogueMatchPreferenceInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('DialogueMatchPreferences', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'DialogueMatchPreferences', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('DialogueMatchPreferences', documentWithId);

  return documentWithId;
}

export async function updateDialogueMatchPreference({ selector, data }: UpdateDialogueMatchPreferenceInput, context: ResolverContext) {
  const { currentUser, DialogueMatchPreferences } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: dialoguematchpreferenceSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('DialogueMatchPreferences', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, DialogueMatchPreferences, dialoguematchpreferenceSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('DialogueMatchPreferences', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: DialogueMatchPreferences, oldDocument, data: origData });

  return updatedDocument;
}
