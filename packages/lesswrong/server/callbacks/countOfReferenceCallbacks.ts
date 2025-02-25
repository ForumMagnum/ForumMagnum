import { getSchema } from "@/lib/utils/getSchema";
import { loggerConstructor } from "@/lib/utils/logging";
import { collectionNameToTypeName, getAllCollections, getCollection } from "@/lib/vulcan-lib/getCollection";
import { AfterCreateCallbackProperties, DeleteCallbackProperties, getCollectionHooks, UpdateCallbackProperties } from "../mutationCallbacks";
import { elasticSyncDocument } from "../search/elastic/elasticCallbacks";
import { searchIndexedCollectionNamesSet } from "@/lib/search/searchUtil";

type CountOfReferenceMap = Record<string, Record<string, CountOfReferenceOptions>>;

type CollectionFieldEntry = [string, CollectionFieldSpecification<CollectionNameString>];
type CollectionFieldEntryWithCountOfReferences = [string, CollectionFieldSpecification<CollectionNameString> & { countOfReferences: CountOfReferenceOptions }];

function isCountOfReferencesField(field: CollectionFieldEntry): field is CollectionFieldEntryWithCountOfReferences {
  return !!field[1].countOfReferences;
}

/**
 * Memoize the countOfReference field options by collection name, to avoid
 * refetching them on every mutation.
 */
const getAllCountOfReferenceFieldsByTargetCollection = (() => {
  let allCountOfReferenceFields: CountOfReferenceMap;
  return () => {
    if (!allCountOfReferenceFields) {
      allCountOfReferenceFields = getAllCollections().reduce<CountOfReferenceMap>((acc, collection): CountOfReferenceMap => {
        const schema = getSchema(collection);
        const collectionName: CollectionNameString = collection.collectionName;

        const countOfReferencesFields = Object.fromEntries(
          Object
            .entries(schema)
            .filter(isCountOfReferencesField)
            .map(([fieldName, fieldSpec]) => [fieldName, fieldSpec.countOfReferences])
        );
        
        const updatedAcc: CountOfReferenceMap = { ...acc, [collectionName]: countOfReferencesFields };

        return updatedAcc;
      }, {});
    }

    return allCountOfReferenceFields;
  }
})();

interface CountOfReferenceFunctionGeneratorOptions<N extends CollectionNameString> {
  denormalizedLogger: (...args: any[]) => void,
  foreignTypeName: string,
  foreignFieldName: string,
  filter: (obj: AnyBecauseHard) => boolean,
  collectionName: N,
  fieldName: string,
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
  foreignTypeName,
  foreignFieldName,
  filter,
  collectionName,
  fieldName,
  resync,
  newDocument,
  afterCreateProperties
}: CreateAfterCountOfReferenceFunctionOptions<N>): Promise<ObjectsByCollectionName[N]> {
  // This type erasure is here for two reasons:
  // 1. indexing by foreignFieldName is annoying otherwise
  // 2. without it, the type checker might be doing an N by N comparison by number of collections, which is slow
  const newDoc = newDocument as AnyBecauseHard;

  denormalizedLogger(`about to test new ${foreignTypeName}`, newDoc);

  if (newDoc[foreignFieldName] && filter(newDoc)) {
    denormalizedLogger(`new ${foreignTypeName} should increment ${newDoc[foreignFieldName]}`);
    const collection = getCollection(collectionName);
    await collection.rawUpdateOne(newDoc[foreignFieldName], {
      $inc: { [fieldName]: 1 }
    });
    resync(newDoc[foreignFieldName]);
  }

  return newDoc;
}

async function updateCountOfReferencesAfterUpdate<N extends CollectionNameString>({
  denormalizedLogger,
  foreignTypeName,
  collectionName,
  filter,
  foreignFieldName,
  fieldName,
  resync,
  newDocument,
  updateAfterProperties,
}: UpdateAfterCountOfReferenceFunctionOptions<N>): Promise<ObjectsByCollectionName[N]> {
  // This type erasures are here for two reasons:
  // 1. indexing by foreignFieldName is annoying otherwise
  // 2. without it, the type checker might be doing an N by N comparison by number of collections, which is slow
  const newDoc = newDocument as AnyBecauseHard;
  const oldDocument = updateAfterProperties.oldDocument as AnyBecauseHard;

  denormalizedLogger(`about to test updating ${foreignTypeName}`, newDoc, oldDocument);
  const countingCollection = getCollection(collectionName);
  if (filter(newDoc) && !filter(oldDocument)) {
    // The old doc didn't count, but the new doc does. Increment on the new doc.
    if (newDoc[foreignFieldName]) {
      denormalizedLogger(`updated ${foreignTypeName} should increment ${newDoc[foreignFieldName]}`);
      await countingCollection.rawUpdateOne(newDoc[foreignFieldName], {
        $inc: { [fieldName]: 1 }
      });
      resync(newDoc[foreignFieldName]);
    }
  } else if (!filter(newDoc) && filter(oldDocument)) {
    // The old doc counted, but the new doc doesn't. Decrement on the old doc.
    if (oldDocument[foreignFieldName]) {
      denormalizedLogger(`updated ${foreignTypeName} should decrement ${newDoc[foreignFieldName]}`);
      await countingCollection.rawUpdateOne(oldDocument[foreignFieldName], {
        $inc: { [fieldName]: -1 }
      });
      resync(newDoc[foreignFieldName]);
    }
  } else if (filter(newDoc) && oldDocument[foreignFieldName] !== newDoc[foreignFieldName]) {
    denormalizedLogger(`${foreignFieldName} of ${foreignTypeName} has changed from ${oldDocument[foreignFieldName]} to ${newDoc[foreignFieldName]}`);
    // The old and new doc both count, but the reference target has changed.
    // Decrement on one doc and increment on the other.
    if (oldDocument[foreignFieldName]) {
      denormalizedLogger(`changing ${foreignFieldName} leads to decrement of ${oldDocument[foreignFieldName]}`);
      await countingCollection.rawUpdateOne(oldDocument[foreignFieldName], {
        $inc: { [fieldName]: -1 }
      });
      resync(newDoc[foreignFieldName]);
    }
    if (newDoc[foreignFieldName]) {
      denormalizedLogger(`changing ${foreignFieldName} leads to increment of ${newDoc[foreignFieldName]}`);
      await countingCollection.rawUpdateOne(newDoc[foreignFieldName], {
        $inc: { [fieldName]: 1 }
      });
      resync(newDoc[foreignFieldName]);
    }
  }
  return newDoc;
}

async function updateCountOfReferencesAfterDelete<N extends CollectionNameString>({
  denormalizedLogger,
  foreignTypeName,
  foreignFieldName,
  filter,
  collectionName,
  fieldName,
  resync,
  deleteAsyncProperties,
}: DeleteAsyncCountOfReferenceFunctionOptions<N>): Promise<void> {
  const document = deleteAsyncProperties.document as AnyBecauseHard;

  denormalizedLogger(`about to test deleting ${foreignTypeName}`, document);
  if (document[foreignFieldName] && filter(document)) {
    denormalizedLogger(`deleting ${foreignTypeName} should decrement ${document[foreignFieldName]}`);
    const countingCollection = getCollection(collectionName);
    await countingCollection.rawUpdateOne(document[foreignFieldName], {
      $inc: { [fieldName]: -1 }
    });
    resync(document[foreignFieldName]);
  }
}

// TODO: could consider memoizing this function as well
function getSharedCountOfReferenceFunctionOptions<N extends CollectionNameString>(collectionName: N, fieldName: string) {
  const countOfReferencesFieldOptions = getAllCountOfReferenceFieldsByTargetCollection()[collectionName];
  const { foreignCollectionName, foreignFieldName, filterFn, resyncElastic } = countOfReferencesFieldOptions[fieldName];

  const resync = (documentId: string) => {
    if (resyncElastic && searchIndexedCollectionNamesSet.has(collectionName)) {
      void elasticSyncDocument(collectionName, documentId);
    }
  }

  const denormalizedLogger = loggerConstructor(`callbacks-${collectionName.toLowerCase()}-denormalized-${fieldName}`)
  
  const foreignTypeName = collectionNameToTypeName(foreignCollectionName);
  const filter = filterFn ?? ((doc: AnyBecauseHard) => true);

  return { denormalizedLogger, foreignTypeName, foreignFieldName, filter, collectionName, fieldName, resync };
}

type RunCountOfReferenceCallbacksOptions<N extends CollectionNameString> = {
  collectionName: N
} & (
  | { callbackStage: 'createAfter', newDocument: Partial<DbInsertion<ObjectsByCollectionName[N]>>, afterCreateProperties: AfterCreateCallbackProperties<N> }
  | { callbackStage: 'updateAfter', newDocument: ObjectsByCollectionName[N], updateAfterProperties: UpdateCallbackProperties<N> }
  | { callbackStage: 'deleteAsync', deleteAsyncProperties: DeleteCallbackProperties<N> }
);

/** TODO: this shouldn't be used until we stop using or refactor `addCountOfReferenceCallbacks` */
export async function runCountOfReferenceCallbacks<N extends CollectionNameString>(options: RunCountOfReferenceCallbacksOptions<N>) {
  const countOfReferencesFieldsOnCollection = getAllCountOfReferenceFieldsByTargetCollection()[options.collectionName];
  for (let fieldName of Object.keys(countOfReferencesFieldsOnCollection)) {
    const sharedOptions = getSharedCountOfReferenceFunctionOptions(options.collectionName, fieldName);

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

export function addCountOfReferenceCallbacks() {
  for (let collection of getAllCollections()) {
    const collectionName = collection.collectionName;
    const schema = getSchema(collection);
    for (let fieldName of Object.keys(schema)) {
      const countOfReferencesOptions = schema[fieldName].countOfReferences;
      if (!countOfReferencesOptions) {
        continue;
      }
      const resync = (documentId: string) => {
        if (countOfReferencesOptions.resyncElastic) {
          void elasticSyncDocument(collectionName, documentId);
        }
      }
      const denormalizedLogger = loggerConstructor(`callbacks-${collectionName.toLowerCase()}-denormalized-${fieldName}`)

      const { foreignCollectionName, foreignFieldName, filterFn } = countOfReferencesOptions;
      const foreignCollection = getCollection(foreignCollectionName);
      const foreignTypeName = foreignCollection.typeName;
      const foreignCollectionCallbackPrefix = foreignTypeName.toLowerCase();
      const filter = filterFn || ((doc: AnyBecauseHard) => true);

      // When inserting a new document which potentially needs to be counted, follow
      // its reference and update with $inc.
      getCollectionHooks(foreignCollectionName).createAfter.add(
        async (newDoc: AnyBecauseTodo, {currentUser, collection, context}: AnyBecauseTodo) => {
          denormalizedLogger(`about to test new ${foreignTypeName}`, newDoc)
          if (newDoc[foreignFieldName] && filter(newDoc)) {
            denormalizedLogger(`new ${foreignTypeName} should increment ${newDoc[foreignFieldName]}`)
            const collection = getCollection(collectionName);
            await collection.rawUpdateOne(newDoc[foreignFieldName], {
              $inc: { [fieldName]: 1 }
            });
            resync(newDoc[foreignFieldName]);
          }

          return newDoc;
        }
      );

      // When updating a document, we may need to decrement a count, we may
      // need to increment a count, we may need to do both with them cancelling
      // out, or we may need to both but on different documents.
      getCollectionHooks(foreignCollectionName).updateAfter.add(
        async (newDoc: AnyBecauseTodo, {oldDocument, currentUser, collection}: AnyBecauseTodo) => {
          denormalizedLogger(`about to test updating ${foreignTypeName}`, newDoc, oldDocument)
          const countingCollection = getCollection(collectionName);
          if (filter(newDoc) && !filter(oldDocument)) {
            // The old doc didn't count, but the new doc does. Increment on the new doc.
            if (newDoc[foreignFieldName]) {
              denormalizedLogger(`updated ${foreignTypeName} should increment ${newDoc[foreignFieldName]}`)
              await countingCollection.rawUpdateOne(newDoc[foreignFieldName], {
                $inc: { [fieldName]: 1 }
              });
              resync(newDoc[foreignFieldName]);
            }
          } else if (!filter(newDoc) && filter(oldDocument)) {
            // The old doc counted, but the new doc doesn't. Decrement on the old doc.
            if (oldDocument[foreignFieldName]) {
              denormalizedLogger(`updated ${foreignTypeName} should decrement ${newDoc[foreignFieldName]}`)
              await countingCollection.rawUpdateOne(oldDocument[foreignFieldName], {
                $inc: { [fieldName]: -1 }
              });
              resync(newDoc[foreignFieldName]);
            }
          } else if (filter(newDoc) && oldDocument[foreignFieldName] !== newDoc[foreignFieldName]) {
            denormalizedLogger(`${foreignFieldName} of ${foreignTypeName} has changed from ${oldDocument[foreignFieldName]} to ${newDoc[foreignFieldName]}`)
            // The old and new doc both count, but the reference target has changed.
            // Decrement on one doc and increment on the other.
            if (oldDocument[foreignFieldName]) {
              denormalizedLogger(`changing ${foreignFieldName} leads to decrement of ${oldDocument[foreignFieldName]}`)
              await countingCollection.rawUpdateOne(oldDocument[foreignFieldName], {
                $inc: { [fieldName]: -1 }
              });
              resync(newDoc[foreignFieldName]);
            }
            if (newDoc[foreignFieldName]) {
              denormalizedLogger(`changing ${foreignFieldName} leads to increment of ${newDoc[foreignFieldName]}`)
              await countingCollection.rawUpdateOne(newDoc[foreignFieldName], {
                $inc: { [fieldName]: 1 }
              });
              resync(newDoc[foreignFieldName]);
            }
          }
          return newDoc;
        }
      );
      getCollectionHooks(foreignCollectionName).deleteAsync.add(
        async ({document, currentUser, collection}: AnyBecauseTodo) => {
          denormalizedLogger(`about to test deleting ${foreignTypeName}`, document)
          if (document[foreignFieldName] && filter(document)) {
            denormalizedLogger(`deleting ${foreignTypeName} should decrement ${document[foreignFieldName]}`)
            const countingCollection = getCollection(collectionName);
            await countingCollection.rawUpdateOne(document[foreignFieldName], {
              $inc: { [fieldName]: -1 }
            });
            resync(document[foreignFieldName]);
          }
        }
      );
    }
  }
}
