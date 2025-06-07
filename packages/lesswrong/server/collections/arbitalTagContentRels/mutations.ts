
import schema from "@/lib/collections/arbitalTagContentRels/newSchema";
import { updateCountOfReferencesOnOtherCollectionsAfterCreate } from "@/server/callbacks/countOfReferenceCallbacks";
import { getLegacyCreateCallbackProps, insertAndReturnCreateAfterProps, runFieldOnCreateCallbacks } from "@/server/vulcan-lib/mutators";


export async function createArbitalTagContentRel({ data }: { data: Partial<DbArbitalTagContentRel> }, context: ResolverContext) {
  const { currentUser } = context;

  const callbackProps = await getLegacyCreateCallbackProps('ArbitalTagContentRels', {
    context,
    data,
    schema,
  });

  data = callbackProps.document;

  data = await runFieldOnCreateCallbacks(schema, data, callbackProps);

  const afterCreateProperties = await insertAndReturnCreateAfterProps(data, 'ArbitalTagContentRels', callbackProps);
  let documentWithId = afterCreateProperties.document;

  await updateCountOfReferencesOnOtherCollectionsAfterCreate('ArbitalTagContentRels', documentWithId);

  return documentWithId;
}

