import { getSchema } from "@/lib/utils/getSchema";
import { loggerConstructor } from "@/lib/utils/logging";
import { getAllCollections, getCollection } from "@/lib/vulcan-lib/getCollection";
import { getCollectionHooks } from "../mutationCallbacks";
import { elasticSyncDocument } from "../search/elastic/elasticCallbacks";


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
