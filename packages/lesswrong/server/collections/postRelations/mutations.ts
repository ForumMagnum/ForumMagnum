
import schema from "@/lib/collections/postRelations/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate, updateCountOfReferencesOnOtherCollectionsAfterUpdate } from "@/server/callbacks/countOfReferenceCallbacks";
import { logFieldChanges } from "@/server/fieldChanges";
import { getLegacyCreateCallbackProps, getLegacyUpdateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks, runFieldOnUpdateCallbacks, updateAndReturnDocument } from "@/server/vulcan-lib/mutators";
import cloneDeep from "lodash/cloneDeep";


export async function createPostRelation({ data }: { data: Partial<DbPostRelation> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('PostRelations', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'PostRelations', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('PostRelations', documentWithId);

  return documentWithId;
}

export async function updatePostRelation({ selector, data }: { selector: SelectorInput, data: Partial<DbPostRelation> }, context: ResolverContext) {
  const { currentUser, PostRelations } = context;

  // Save the original mutation (before callbacks add more changes to it) for
  // logging in FieldChanges
  const origData = cloneDeep(data);

  const {
    documentSelector: postrelationSelector,
    updateCallbackProperties,
  } = await getLegacyUpdateCallbackProps('PostRelations', { selector, context, data, schema });

  const { oldDocument } = updateCallbackProperties;

  data = await runFieldOnUpdateCallbacks(schema, data, updateCallbackProperties);

  let updatedDocument = await updateAndReturnDocument(data, PostRelations, postrelationSelector, context);

  await updateCountOfReferencesOnOtherCollectionsAfterUpdate('PostRelations', updatedDocument, oldDocument);

  void logFieldChanges({ currentUser, collection: PostRelations, oldDocument, data: origData });

  return updatedDocument;
}


