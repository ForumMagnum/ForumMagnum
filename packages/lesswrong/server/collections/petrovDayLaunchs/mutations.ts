
import schema from "@/lib/collections/petrovDayLaunchs/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";


const { createFunction, updateFunction } = getDefaultMutationFunctions('PetrovDayLaunchs', {
  createFunction: async ({ data }: { data: Partial<DbPetrovDayLaunch> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('PetrovDayLaunchs', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PetrovDayLaunchs', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PetrovDayLaunchs',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbPetrovDayLaunch> }, context) => {
    const { currentUser, PetrovDayLaunchs } = context;

    const {
      documentSelector: petrovdaylaunchSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('PetrovDayLaunchs', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, PetrovDayLaunchs, petrovdaylaunchSelector, context);

    await runCountOfReferenceCallbacks({
      collectionName: 'PetrovDayLaunchs',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    return updatedDocument;
  },
});


export { createFunction as createPetrovDayLaunch, updateFunction as updatePetrovDayLaunch };
