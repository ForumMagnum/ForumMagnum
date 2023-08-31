import { Utils, getCollection } from './vulcan-lib';
import moment from 'moment';

// Get relative link to conversation (used only in session)
export const conversationGetLink = (conversation: HasIdType): string => {
  return `/inbox/${conversation._id}`;
};

// Get relative link to conversation of message (conversations are only linked to relatively)
export const messageGetLink = (message: DbMessage): string => {
  return `/inbox/${message.conversationId}`;
};

export function constantTimeCompare({ correctValue, unknownValue }: { correctValue: string, unknownValue: string }) {
  try {
    const correctValueChars = correctValue.split('');
    const unknownValueChars = unknownValue.split('');

    let allCharsEqual = true;

    // Iterate over the array of correct characters, which has a known (constant) length, to mitigate certain timing attacks
    for (const [idx, char] of Object.entries(correctValueChars)) {
      const matchedIndexCharsEqual = char === unknownValueChars[idx as AnyBecauseTodo];
      allCharsEqual = matchedIndexCharsEqual && allCharsEqual;
    }

    const sameLength = correctValueChars.length === unknownValueChars.length;

    return allCharsEqual && sameLength;
  } catch {
    return false;
  }
}

// LESSWRONG version of getting unused slug. Modified to also include "oldSlugs" array
Utils.getUnusedSlug = async function <T extends HasSlugType>(collection: CollectionBase<HasSlugType>, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  let suffix = '';
  let index = 0;
  
  let existingDocuments = await getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
  // test if slug is already in use
  while (!!existingDocuments?.length) {
    // Filter out our own document (i.e. don't change the slug if the only conflict is with ourselves)
    const conflictingDocuments = existingDocuments.filter((doc) => doc._id !== documentId)
    // If there are other documents we conflict with, change the index and slug, then check again
    if (!!conflictingDocuments.length) {
      index++
      suffix = '-'+index;
      existingDocuments = await getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
    } else {
      break
    }
  }
  return slug+suffix;
};

const getDocumentsBySlug = async <T extends HasSlugType>({slug, suffix, useOldSlugs, collection}: {
  slug: string,
  suffix: string,
  useOldSlugs: boolean,
  collection: CollectionBase<T>
}): Promise<Array<T>> => {
  return await collection.find(useOldSlugs ? 
    {$or: [{slug: slug+suffix},{oldSlugs: slug+suffix}]} : 
    {slug: slug+suffix}
  ).fetch()
}

// LESSWRONG version of getting unused slug by collection name. Modified to also include "oldSlugs" array
Utils.getUnusedSlugByCollectionName = async function (collectionName: CollectionNameString, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  // Not enforced: collectionName is a collection that has slugs
  const collection = getCollection(collectionName) as CollectionBase<HasSlugType>;
  return await Utils.getUnusedSlug(collection, slug, useOldSlugs, documentId)
};

Utils.slugIsUsed = async (collectionName: CollectionNameString, slug: string): Promise<boolean> => {
  const collection = getCollection(collectionName)
  const existingUserWithSlug = await collection.findOne({$or: [
    {slug: slug}, {oldSlugs: slug}
  ]});
  return !!existingUserWithSlug
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Logs how long it takes for a function to execute.  See usage example below.
 * 
 * Original:
 * 
 * `await sql.none(compiled.sql, compiled.args));`
 * 
 * Wrapped:
 * 
 * `await timedFunc('sql.none', () => sql.none(compiled.sql, compiled.args));`
 */
export async function timedFunc<O>(label: string, func: () => O) {
  const startTime = new Date();
  let result: O;
  try {
    result = await func();
  } finally {
    const endTime = new Date();
    const runtime = endTime.valueOf() - startTime.valueOf();
    // eslint-disable-next-line no-console
    console.log(`${label} took ${runtime} ms`);
  }
  return result;
}

export const generateDateSeries = (startDate: moment.Moment | Date, endDate: moment.Moment | Date) => {
  const dateSeries = [];
  let currentDate = moment(startDate);
  while (currentDate.isBefore(endDate)) {
    dateSeries.push(currentDate.format("YYYY-MM-DD"));
    currentDate = currentDate.add(1, "days");
  }
  return dateSeries;
};
