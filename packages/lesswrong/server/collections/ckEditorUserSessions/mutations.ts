
import schema from "@/lib/collections/ckEditorUserSessions/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


const { createFunction, updateFunction } = getDefaultMutationFunctions('CkEditorUserSessions', {
  createFunction: async ({ data }: { data: Partial<DbCkEditorUserSession> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('CkEditorUserSessions', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'CkEditorUserSessions', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'CkEditorUserSessions',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbCkEditorUserSession> }, context) => {
    const { currentUser, CkEditorUserSessions } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: ckeditorusersessionSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('CkEditorUserSessions', { selector, context, data, schema });

    const { oldDocument } = updateCallbackProperties;

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, CkEditorUserSessions, ckeditorusersessionSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'CkEditorUserSessions',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: CkEditorUserSessions, oldDocument, data: origData });

    return updatedDocument;
  },
});


export { createFunction as createCkEditorUserSession, updateFunction as updateCkEditorUserSession };
