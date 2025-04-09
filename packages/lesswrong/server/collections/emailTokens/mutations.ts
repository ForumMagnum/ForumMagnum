
import schema from "@/lib/collections/emailTokens/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";


export async function createEmailToken({ data }: { data: Partial<DbEmailTokens> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('EmailTokens', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'EmailTokens', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('EmailTokens', documentWithId);

  return documentWithId;
}

export async function updateEmailToken({ selector, data }: { data: Partial<DbEmailTokens>, selector: SelectorInput }, context: ResolverContext) {
  const { currentUser, EmailTokens } = context;

  const {
    documentSelector: emailtokensSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('EmailTokens', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, EmailTokens, emailtokensSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('EmailTokens', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}


