
import schema from "@/lib/collections/bans/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { assignUserIdToData, getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createBan({ data }: CreateBanInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Bans', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Bans', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Bans', documentWithId);

  return documentWithId;
}

export async function updateBan({ selector, data }: UpdateBanInput, context: ResolverContext) {
  const { currentUser, Bans } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: banSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Bans', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Bans, banSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Bans', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: Bans, oldDocument, data: origData });

  return updatedDocument;
}
