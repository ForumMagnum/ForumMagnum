import schema from "@/lib/collections/reviewWinnerArts/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { backgroundTask } from "@/server/utils/backgroundTask";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createReviewWinnerArt({ data }: { data: Partial<DbReviewWinnerArt> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ReviewWinnerArts', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ReviewWinnerArts', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ReviewWinnerArts', documentWithId);

  return documentWithId;
}

export async function updateReviewWinnerArt({ selector, data }: { selector: SelectorInput, data: Partial<DbReviewWinnerArt> }, context: ResolverContext) {
  const { currentUser, ReviewWinnerArts } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: reviewwinnerartSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('ReviewWinnerArts', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, ReviewWinnerArts, reviewwinnerartSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('ReviewWinnerArts', updatedDocument, oldDocument);

  backgroundTask(logFieldChanges({ currentUser, collection: ReviewWinnerArts, oldDocument, data: origData }));

  return updatedDocument;
}

