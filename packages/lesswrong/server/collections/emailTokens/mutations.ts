
import schema from "@/lib/collections/emailTokens/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument, assignUserIdToData } from "@/server/vulcan-lib/mutators";


const { createFunction, updateFunction } = getDefaultMutationFunctions('EmailTokens', {
  createFunction: async ({ data }: { data: Partial<DbEmailTokens> }, context) => {
    const { currentUser } = context;

    const callbackProps = await getLegacyCreateCallbackProps('EmailTokens', {
      context,
      data,
      schema,
    });

    assignUserIdToData(data, currentUser, schema);

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'EmailTokens', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await updateCountOfReferencesOnOtherCollectionsAfterCreate('EmailTokens', documentWithId);

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { data: Partial<DbEmailTokens>, selector: SelectorInput }, context) => {
    const { currentUser, EmailTokens } = context;

    const {
      documentSelector: emailtokensSelector,
      updateCallbackProperties,
    } = await getLegacyUpdateCallbackProps('EmailTokens', { selector, context, data, schema });

    data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

    let updatedDocument = await updateAndReturnDocument(data, EmailTokens, emailtokensSelector, context);

    await updateCountOfReferencesOnOtherCollectionsAfterUpdate('EmailTokens', updatedDocument, updateCallbackProperties.oldDocument);

    return updatedDocument;
  },
});


export { createFunction as createEmailToken, updateFunction as updateEmailToken };
