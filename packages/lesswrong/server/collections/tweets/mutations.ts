
import schema from "@/lib/collections/tweets/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createTweet({ data }: { data: Partial<DbTweet> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('Tweets', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'Tweets', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('Tweets', documentWithId);

  return documentWithId;
}

export async function updateTweet({ selector, data }: { selector: SelectorInput, data: Partial<DbTweet> }, context: ResolverContext) {
  const { currentUser, Tweets } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: tweetSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('Tweets', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, Tweets, tweetSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('Tweets', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: Tweets, oldDocument, data: origData });

  return updatedDocument;
}


