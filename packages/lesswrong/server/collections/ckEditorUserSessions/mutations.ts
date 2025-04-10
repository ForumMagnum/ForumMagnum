
import schema from "@/lib/collections/ckEditorUserSessions/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createCkEditorUserSession({ data }: { data: Partial<DbCkEditorUserSession> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('CkEditorUserSessions', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'CkEditorUserSessions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('CkEditorUserSessions', documentWithId);

  return documentWithId;
}

export async function updateCkEditorUserSession({ selector, data }: { selector: SelectorInput, data: Partial<DbCkEditorUserSession> }, context: ResolverContext) {
  const { currentUser, CkEditorUserSessions } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: ckeditorusersessionSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('CkEditorUserSessions', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, CkEditorUserSessions, ckeditorusersessionSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('CkEditorUserSessions', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: CkEditorUserSessions, oldDocument, data: origData });

  return updatedDocument;
}


