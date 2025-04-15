
import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";


export async function createArbitalTagContentRel({ data }: CreateArbitalTagContentRelInput, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ArbitalTagContentRels', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ArbitalTagContentRels', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ArbitalTagContentRels', documentWithId);

  return documentWithId;
}

export async function updateArbitalTagContentRel({ selector, data }: UpdateArbitalTagContentRelInput, context: ResolverContext) {
  const { currentUser, ArbitalTagContentRels } = context;

  const {
    documentSelector: arbitaltagcontentrelSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ArbitalTagContentRels', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, ArbitalTagContentRels, arbitaltagcontentrelSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ArbitalTagContentRels', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}
