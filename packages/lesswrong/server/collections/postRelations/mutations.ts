
import schema from "@/lib/collections/postRelations/newSchema";
import { runCountOfReferenceCallbacks } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getDefaultMutationFunctions } from "@/server/resolvers/defaultMutations";
import { checkCreatePermissionsAndReturnProps, checkUpdatePermissionsAndReturnProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import { dataToModifier } from "@/server/vulcan-lib/validation";
import clone from "lodash/clone";
import cloneDeep from "lodash/cloneDeep";


const { createFunction, updateFunction } = getDefaultMutationFunctions('PostRelations', {
  createFunction: async ({ data }: { data: Partial<DbPostRelation> }, context, skipValidation?: boolean) => {
    const { currentUser } = context;

    const callbackProps = await checkCreatePermissionsAndReturnProps('PostRelations', {
      context,
      data,
      schema,
      skipValidation,
    });

    data = callbackProps.document;

    data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

    const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostRelations', callbackProps);
    let documentWithId = afterCreateProperties.document;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostRelations',
      newDocument: documentWithId,
      callbackStage: 'createAfter',
      afterCreateProperties,
    });

    return documentWithId;
  },

  updateFunction: async ({ selector, data }: { selector: SelectorInput, data: Partial<DbPostRelation> }, context, skipValidation?: boolean) => {
    const { currentUser, PostRelations } = context;

    // Save the original mutation (before callbacks add more changes to it) for
    // logging in FieldChanges
    const origData = cloneDeep(data);

    const {
      documentSelector: postrelationSelector,
      previewDocument, 
      updateCallbackProperties,
    } = await checkUpdatePermissionsAndReturnProps('PostRelations', { selector, context, data, schema, skipValidation });

    const { oldDocument } = updateCallbackProperties;

    const dataAsModifier = dataToModifier(clone(data));
    data = await runFieldOnUpdateCallbacks(schema, data, dataAsModifier, updateCallbackProperties);

    let modifier = dataToModifier(data);

    // This cast technically isn't safe but it's implicitly been there since the original updateMutator logic
    // The only difference could be in the case where there's no update (due to an empty modifier) and
    // we're left with the previewDocument, which could have EditableFieldInsertion values for its editable fields
    let updatedDocument = await updateAndReturnDocument(modifier, PostRelations, postrelationSelector, context) ?? previewDocument as DbPostRelation;

    await runCountOfReferenceCallbacks({
      collectionName: 'PostRelations',
      newDocument: updatedDocument,
      callbackStage: "updateAfter",
      updateAfterProperties: updateCallbackProperties,
    });

    void logFieldChanges({ currentUser, collection: PostRelations, oldDocument, data: origData });

    return updatedDocument;
  },
});


export { createFunction as createPostRelation, updateFunction as updatePostRelation };
