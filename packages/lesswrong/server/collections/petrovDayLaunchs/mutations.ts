
import schema from "@/lib/collections/petrovDayLaunchs/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
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

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('PetrovDayLaunchs', documentWithId);

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

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PetrovDayLaunchs', updatedDocument, updateCallbackProperties.oldDocument);

    return updatedDocument;
  },
});


export { createFunction as createPetrovDayLaunch, updateFunction as updatePetrovDayLaunch };
