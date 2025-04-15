
import schema from "@/lib/collections/googleServiceAccountSessions/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";


export async function createGoogleServiceAccountSession({ data }: CreateGoogleServiceAccountSessionInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('GoogleServiceAccountSessions', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'GoogleServiceAccountSessions', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('GoogleServiceAccountSessions', documentWithId);

  return documentWithId;
}

export async function updateGoogleServiceAccountSession({ selector, data }: UpdateGoogleServiceAccountSessionInput, context: ResolverContext) {
  const { currentUser, GoogleServiceAccountSessions } = context;

  const {
    documentSelector: googleserviceaccountsessionSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('GoogleServiceAccountSessions', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, GoogleServiceAccountSessions, googleserviceaccountsessionSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('GoogleServiceAccountSessions', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}
