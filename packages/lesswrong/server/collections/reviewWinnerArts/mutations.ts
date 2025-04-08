
import schema from "@/lib/collections/reviewWinnerArts/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


const { createFunction, updateFunction } = getDefaultMutationFunctions('ReviewWinnerArts', {
  createFunction: async ({ data }: { data: Partial<DbReviewWinnerArt> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('ReviewWinnerArts', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ReviewWinnerArts', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'ReviewWinnerArts',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbReviewWinnerArt> }, context) => {
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

    await runCountOfReferenceCallbacks({
      collectionName: 'ReviewWinnerArts',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: ReviewWinnerArts, oldDocument, data: origData });

    return updatedDocument;
  },
});


export { createFunction as createReviewWinnerArt, updateFunction as updateReviewWinnerArt };
