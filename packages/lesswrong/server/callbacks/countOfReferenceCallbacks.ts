import { loggerConstructor } from "@/lib/utils/logging";
// TODO: move the getAllCountOfReferenceFieldsByTargetCollection function out of this file to reduce cyclical dependencies?
import { getCollection } from "@/server/collections/allCollections";
import { searchIndexedCollectionNamesSet } from "@/lib/search/searchUtil";
import type { AfterCreateCallbackProperties, DeleteCallbackProperties, UpdateCallbackProperties } from "../mutationCallbacks";
import { collectionNameToTypeName } from "@/lib/generated/collectionTypeNames";
import { allSchemas } from "@/lib/schema/allSchemas";

interface InvertedCountOfReferenceOptions {
  sourceCollectionName: CollectionNameString,
  referenceFieldName: string,
  targetKeyFieldName: string,
  filterFn?: (obj: AnyBecauseHard) => boolean,
  resyncElastic: boolean,
}

type CountOfReferenceMap = Record<string, InvertedCountOfReferenceOptions[] | undefined>;

type CollectionFieldEntry = [string, CollectionFieldSpecification<CollectionNameString>];
type CollectionFieldEntryWithCountOfReferences = [string, CollectionFieldSpecification<CollectionNameString> & { countOfReferences: CountOfReferenceOptions }];

function isCountOfReferencesField(field: CollectionFieldEntry): field is CollectionFieldEntryWithCountOfReferences {
  return !!field[1].countOfReferences;
}

/**
 * When we mutate a document of collection A, we need to update the
 * countOfReference fields of all collections B, C, D, etc. that reference A.
 * However, our field definitions are keyed by collection names B, C, D, etc.
 * So we need to iterate over all collections and aggregate all the fields
 * that reference A into an array accessed by collection name A, with a pointer
 * to the collection and field name that needs to be updated (which is the countOfReference field).
 * 
 * This needs to be an array rather than an object because there could in principle be
 * multiple fields with the same field names that reference A, since they could be
 * in different collections.
 *
 * We also memoize the result to avoid recomputing it on every mutation.
 */
const getAllCountOfReferenceFieldsByTargetCollection = (() => {
  let allCountOfReferenceFields: CountOfReferenceMap;
  return () => {
    if (!allCountOfReferenceFields) {
      allCountOfReferenceFields = Object.entries(allSchemas).reduce<CountOfReferenceMap>((acc, [collectionName, schema]): CountOfReferenceMap => {
        const sourceCollectionName = collectionName as CollectionNameString;

        Object
          .entries(schema)
          .filter(isCountOfReferencesField)
          .forEach(([referenceFieldName, fieldSpec]) => {
            const { countOfReferences: { foreignCollectionName, foreignFieldName, filterFn, resyncElastic } } = fieldSpec;
            const invertedOptions: InvertedCountOfReferenceOptions = {
              sourceCollectionName,
              referenceFieldName,
              targetKeyFieldName: foreignFieldName,
              filterFn,
              resyncElastic,
            };

            if (!acc[foreignCollectionName]) {
              acc[foreignCollectionName] = [];
            }

            acc[foreignCollectionName]?.push(invertedOptions);
          });

        return acc;
      }, {});
    }

    return allCountOfReferenceFields;
  }
})();

interface CountOfReferenceFunctionGeneratorOptions<N extends CollectionNameString> {
  denormalizedLogger: (...args: any[]) => void,
  targetTypeName: string,
  targetKeyFieldName: string,
  filter: (obj: AnyBecauseHard) => boolean,
  sourceCollectionName: N,
  referenceFieldName: string,
  resync: (documentId: string) => void
}

interface CreateAfterCountOfReferenceFunctionOptions<N extends CollectionNameString> extends CountOfReferenceFunctionGeneratorOptions<N> {
  newDocument: Partial<DbInsertion<ObjectsByCollectionName[N]>>,
  afterCreateProperties: AfterCreateCallbackProperties<N>
}

interface UpdateAfterCountOfReferenceFunctionOptions<N extends CollectionNameString> extends CountOfReferenceFunctionGeneratorOptions<N> {
  newDocument: ObjectsByCollectionName[N],
  updateAfterProperties: UpdateCallbackProperties<N>
}

interface DeleteAsyncCountOfReferenceFunctionOptions<N extends CollectionNameString> extends CountOfReferenceFunctionGeneratorOptions<N> {
  deleteAsyncProperties: DeleteCallbackProperties<N>
}

async function updateCountOfReferencesAfterCreate<N extends CollectionNameString>({
  denormalizedLogger,
  targetTypeName,
  targetKeyFieldName,
  filter,
  sourceCollectionName,
  referenceFieldName,
  resync,
  newDocument,
  afterCreateProperties
}: CreateAfterCountOfReferenceFunctionOptions<N>): Promise<ObjectsByCollectionName[N]> {
  // This type erasure is here for two reasons:
  // 1. indexing by foreignFieldName is annoying otherwise
  // 2. without it, the type checker might be doing an N by N comparison by number of collections, which is slow
  const newDoc = newDocument as AnyBecauseHard;

  denormalizedLogger(`about to test new ${targetTypeName}`, newDoc);

  if (newDoc[targetKeyFieldName] && filter(newDoc)) {
    denormalizedLogger(`new ${targetTypeName} should increment ${newDoc[targetKeyFieldName]}`);
    const collection = getCollection(sourceCollectionName);
    await collection.rawUpdateOne(newDoc[targetKeyFieldName], {
      $inc: { [referenceFieldName]: 1 }
    });
    resync(newDoc[targetKeyFieldName]);
  }

  return newDoc;
}

async function updateCountOfReferencesAfterUpdate<N extends CollectionNameString>({
  denormalizedLogger,
  targetTypeName,
  sourceCollectionName,
  filter,
  targetKeyFieldName,
  referenceFieldName,
  resync,
  newDocument,
  updateAfterProperties,
}: UpdateAfterCountOfReferenceFunctionOptions<N>): Promise<ObjectsByCollectionName[N]> {
  // This type erasures are here for two reasons:
  // 1. indexing by foreignFieldName is annoying otherwise
  // 2. without it, the type checker might be doing an N by N comparison by number of collections, which is slow
  const newDoc = newDocument as AnyBecauseHard;
  const oldDocument = updateAfterProperties.oldDocument as AnyBecauseHard;

  denormalizedLogger(`about to test updating ${targetTypeName}`, newDoc, oldDocument);
  const countingCollection = getCollection(sourceCollectionName);
  if (filter(newDoc) && !filter(oldDocument)) {
    // The old doc didn't count, but the new doc does. Increment on the new doc.
    if (newDoc[targetKeyFieldName]) {
      denormalizedLogger(`updated ${targetTypeName} should increment ${newDoc[targetKeyFieldName]}`);
      await countingCollection.rawUpdateOne(newDoc[targetKeyFieldName], {
        $inc: { [referenceFieldName]: 1 }
      });
      resync(newDoc[targetKeyFieldName]);
    }
  } else if (!filter(newDoc) && filter(oldDocument)) {
    // The old doc counted, but the new doc doesn't. Decrement on the old doc.
    if (oldDocument[targetKeyFieldName]) {
      denormalizedLogger(`updated ${targetTypeName} should decrement ${newDoc[targetKeyFieldName]}`);
      await countingCollection.rawUpdateOne(oldDocument[targetKeyFieldName], {
        $inc: { [referenceFieldName]: -1 }
      });
      resync(newDoc[targetKeyFieldName]);
    }
  } else if (filter(newDoc) && oldDocument[targetKeyFieldName] !== newDoc[targetKeyFieldName]) {
    denormalizedLogger(`${targetKeyFieldName} of ${targetTypeName} has changed from ${oldDocument[targetKeyFieldName]} to ${newDoc[targetKeyFieldName]}`);
    // The old and new doc both count, but the reference target has changed.
    // Decrement on one doc and increment on the other.
    if (oldDocument[targetKeyFieldName]) {
      denormalizedLogger(`changing ${targetKeyFieldName} leads to decrement of ${oldDocument[targetKeyFieldName]}`);
      await countingCollection.rawUpdateOne(oldDocument[targetKeyFieldName], {
        $inc: { [referenceFieldName]: -1 }
      });
      resync(newDoc[targetKeyFieldName]);
    }
    if (newDoc[targetKeyFieldName]) {
      denormalizedLogger(`changing ${targetKeyFieldName} leads to increment of ${newDoc[targetKeyFieldName]}`);
      await countingCollection.rawUpdateOne(newDoc[targetKeyFieldName], {
        $inc: { [referenceFieldName]: 1 }
      });
      resync(newDoc[targetKeyFieldName]);
    }
  }
  return newDoc;
}

async function updateCountOfReferencesAfterDelete<N extends CollectionNameString>({
  denormalizedLogger,
  targetTypeName,
  targetKeyFieldName,
  filter,
  sourceCollectionName,
  referenceFieldName,
  resync,
  deleteAsyncProperties,
}: DeleteAsyncCountOfReferenceFunctionOptions<N>): Promise<void> {
  const document = deleteAsyncProperties.document as AnyBecauseHard;

  denormalizedLogger(`about to test deleting ${targetTypeName}`, document);
  if (document[targetKeyFieldName] && filter(document)) {
    denormalizedLogger(`deleting ${targetTypeName} should decrement ${document[targetKeyFieldName]}`);
    const countingCollection = getCollection(sourceCollectionName);
    await countingCollection.rawUpdateOne(document[targetKeyFieldName], {
      $inc: { [referenceFieldName]: -1 }
    });
    resync(document[targetKeyFieldName]);
  }
}

// TODO: could consider memoizing this function as well
function getSharedCountOfReferenceFunctionOptions<N extends CollectionNameString>(targetCollectionName: N, invertedCountOfReferenceOptions: InvertedCountOfReferenceOptions) {
  const { sourceCollectionName, referenceFieldName, targetKeyFieldName, filterFn, resyncElastic } = invertedCountOfReferenceOptions;

  const resync = (documentId: string) => {
    if (resyncElastic && searchIndexedCollectionNamesSet.has(sourceCollectionName)) {
      const { elasticSyncDocument } = require("../search/elastic/elasticCallbacks"); //cycle-breaking
      void elasticSyncDocument(sourceCollectionName, documentId);
    }
  }

  const denormalizedLogger = loggerConstructor(`callbacks-${targetCollectionName.toLowerCase()}-denormalized-${referenceFieldName}`)
  
  const targetTypeName = collectionNameToTypeName[targetCollectionName];
  const filter = filterFn ?? ((doc: AnyBecauseHard) => true);

  return { denormalizedLogger, targetTypeName, targetKeyFieldName, filter, sourceCollectionName, referenceFieldName, resync };
}

type RunCountOfReferenceCallbacksOptions<N extends CollectionNameString> = {
  collectionName: N
} & (
  | { callbackStage: 'createAfter', newDocument: Partial<DbInsertion<ObjectsByCollectionName[N]>>, afterCreateProperties: AfterCreateCallbackProperties<N> }
  | { callbackStage: 'updateAfter', newDocument: ObjectsByCollectionName[N], updateAfterProperties: UpdateCallbackProperties<N> }
  | { callbackStage: 'deleteAsync', deleteAsyncProperties: DeleteCallbackProperties<N> }
);

export async function runCountOfReferenceCallbacks<N extends CollectionNameString>(options: RunCountOfReferenceCallbacksOptions<N>) {
  // This is the collection name of the object being created/updated/deleted, i.e. the "target" collection
  const referenceTargetCollectionName = options.collectionName;
  const countOfReferencesFieldsReferencingCollection = getAllCountOfReferenceFieldsByTargetCollection()[referenceTargetCollectionName];
  if (!countOfReferencesFieldsReferencingCollection) {
    return;
  }

  for (let invertedCountOfReferenceOptions of countOfReferencesFieldsReferencingCollection) {
    const sharedOptions = getSharedCountOfReferenceFunctionOptions(referenceTargetCollectionName, invertedCountOfReferenceOptions);

    if (options.callbackStage === 'createAfter') {
      const { newDocument, afterCreateProperties } = options;
      await updateCountOfReferencesAfterCreate({
        ...sharedOptions,
        newDocument,
        afterCreateProperties
      });
    } else if (options.callbackStage === 'updateAfter') {
      const { newDocument, updateAfterProperties } = options;
      await updateCountOfReferencesAfterUpdate({
        ...sharedOptions,
        newDocument,
        updateAfterProperties
      });
    } else if (options.callbackStage === 'deleteAsync') {
      const { deleteAsyncProperties } = options;
      await updateCountOfReferencesAfterDelete({
        ...sharedOptions,
        deleteAsyncProperties
      });
    }
  }
}
