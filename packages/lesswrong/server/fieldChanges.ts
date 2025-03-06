import { LWEvents } from '../server/collections/lwevents/collection';
import { getSchema } from '../lib/utils/getSchema';
import { createMutator } from './vulcan-lib/mutators';

export const logFieldChanges = async <
  N extends CollectionNameString
>({currentUser, collection, oldDocument, data}: {
  currentUser: DbUser|null,
  collection: CollectionBase<N>,
  oldDocument: ObjectsByCollectionName[N],
  data: Partial<ObjectsByCollectionName[N]>,
}) => {
  let loggedChangesBefore: any = {};
  let loggedChangesAfter: any = {};
  let schema = getSchema(collection);
  
  for (let key of Object.keys(data)) {
    let before = oldDocument[key as keyof ObjectsByCollectionName[N]];
    let after = data[key as keyof ObjectsByCollectionName[N]];
    // Don't log if:
    //  * The field didn't change
    //  * It's a denormalized field
    //  * The logChanges option is present on the field, and false
    //  * The logChanges option is undefined on the field, and is false on the collection
    if (before===after || JSON.stringify(before)===JSON.stringify(after)) continue;
    if (schema[key]?.denormalized) continue;
    if (schema[key]?.logChanges !== undefined && !schema[key]?.logChanges)
      continue;
    if (!schema[key]?.logChanges && !collection.options.logChanges)
      continue;
    
    // As a special case, don't log changes from null to undefined (or vise versa).
    // This special case is necessary because some upstream code (updateMutator) is
    // sloppy about the distinction.
    if (before===undefined && after===null) continue;
    if (after===undefined && before===null) continue;
    
    const sanitizedKey = sanitizeKey(key);
    loggedChangesBefore[sanitizedKey] = before;
    loggedChangesAfter[sanitizedKey] = after;
  }
  
  if (Object.keys(loggedChangesAfter).length > 0) {
    void createMutator({
      collection: LWEvents,
      currentUser,
      document: {
        name: 'fieldChanges',
        documentId: oldDocument._id,
        userId: currentUser?._id,
        important: true,
        properties: {
          before: loggedChangesBefore,
          after: loggedChangesAfter,
        }
      },
      validate: false,
    })
  }
}

function sanitizeKey(key: string): string {
  return key.replace(/\./g, "_");
}
