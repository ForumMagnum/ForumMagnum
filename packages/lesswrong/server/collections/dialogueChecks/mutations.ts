
import schema from "@/lib/collections/dialogueChecks/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


const { createFunction, updateFunction } = getDefaultMutationFunctions('DialogueChecks', {
  createFunction: async ({ data }: { data: Partial<DbDialogueCheck> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('DialogueChecks', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'DialogueChecks', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'DialogueChecks',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { data: Partial<DbDialogueCheck>, selector: SelectorInput }, context) => {
    const { currentUser, DialogueChecks } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: dialoguecheckSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('DialogueChecks', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, DialogueChecks, dialoguecheckSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'DialogueChecks',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: DialogueChecks, oldDocument, data: origData });

    return updatedDocument;
  },
});


export { createFunction as createDialogueCheck, updateFunction as updateDialogueCheck };
