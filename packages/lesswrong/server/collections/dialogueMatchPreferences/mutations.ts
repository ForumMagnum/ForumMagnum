
import schema from "@/lib/collections/dialogueMatchPreferences/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyUpdateCallbackProps, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";

// TODO: deprecate this collection entirely?
export async function updateDialogueMatchPreference({ selector, data }: { selector: SelectorInput, data: Partial<DbDialogueMatchPreference> }, context: ResolverContext) {
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
