
import schema from "@/lib/collections/votes/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";


export async function createVote({ data }: { data: Partial<DbInsertion<DbVote>> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Votes', {
    context,
    data,
    schema,
  });

  assignUserIdToData(data, currentUser, schema);

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Votes', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Votes', documentWithId);

  return documentWithId;
}

export async function updateVote({ selector, data }: { selector: SelectorInput, data: Partial<DbInsertion<DbVote>> }, context: ResolverContext) {
  const { currentUser, Votes } = context;

  const {
    documentSelector: voteSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Votes', { selector, context, data, schema });

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Votes, voteSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Votes', updatedDocument, updateCallbackProperties.oldDocument);

  return updatedDocument;
}


