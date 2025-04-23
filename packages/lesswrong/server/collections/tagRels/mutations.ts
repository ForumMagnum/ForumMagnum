
import schema from "@/lib/collections/tagRels/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { taggedPostNewNotifications, validateTagRelCreate, voteForTagWhenCreated } from "@/server/callbacks/tagCallbackFunctions";
import { assignUserIdToData, getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";


export async function createTagRel({ data }: { data: Partial<DbInsertion<DbTagRel>> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('TagRels', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  await validateTagRelCreate(data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'TagRels', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('TagRels', documentWithId);

  documentWithId = await voteForTagWhenCreated(documentWithId, afterCreateProperties);

  await taggedPostNewNotifications(documentWithId, afterCreateProperties);

  return documentWithId;
}

export async function updateTagRel({ selector, data }: { selector: SelectorInput, data: Partial<DbTagRel> }, context: ResolverContext) {
  const { currentUser, TagRels } = context;

  const {
    documentSelector: tagrelSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('TagRels', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, TagRels, tagrelSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('TagRels', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}
