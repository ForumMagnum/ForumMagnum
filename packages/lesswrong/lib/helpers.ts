import { getCollection } from '@/lib/vulcan-lib';
import moment from 'moment';
import { randomLowercaseId } from '@/lib/random';
import { isServer } from '@/lib/executionEnvironment';

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

// Get an unused slug. If `slug` is already unused, returns it as-is. If it's
// used, finds a suffix such that slug-{suffix} is unused.
//
// Slugs are sequential up to 10, then jump to 4-char IDs, then 8-char IDs.
//
// If useOldSlugs is true, then the slugs that renamed documents used to have
// count as used. If a documentId is provided, that document doesn't count as
// a collision.
export const getUnusedSlug = async function <N extends CollectionNameWithSlug>(
  collection: CollectionBase<N>,
  slug: string,
  useOldSlugs = false,
  documentId?: string,
): Promise<string> {
  let suffix = '';
  let index = 0;
  
  //eslint-disable-next-line no-constant-condition
  while(true) {
    // Test if slug is already in use
    const existingDocuments = await getDocumentsBySlug({slug, suffix, useOldSlugs, collection})
    // Filter out our own document (i.e. don't change the slug if the only conflict is with ourselves)
    const conflictingDocuments = existingDocuments.filter((doc) => doc._id !== documentId)

    // If no conflict, we're done
    if (!conflictingDocuments.length) {
      return slug+suffix;
    }

    // If there are other documents we conflict with, change the index and slug, then check again
    index++;
    
    // Count up indexes sequentially up to 10. After that, randomly generate an ID. This
    // avoids making it so that creating n documents with the same base string is O(n^2).
    // (This came up in development with posts named "test", which there are hundreds of.)
    if (index <= 10) {
      suffix = '-'+index;
    } else {
      const randomIndex = randomLowercaseId(index<20 ? 4 : 8);
      suffix = '-'+randomIndex;
    }
  }
};

const getDocumentsBySlug = async <
  N extends CollectionNameWithSlug,
>({slug, suffix, useOldSlugs, collection}: {
  slug: string,
  suffix: string,
  useOldSlugs: boolean,
  collection: CollectionBase<N>
}): Promise<ObjectsByCollectionName[N][]> => {
  return await collection.find(useOldSlugs ? 
    {$or: [{slug: slug+suffix},{oldSlugs: slug+suffix}]} : 
    {slug: slug+suffix}
  ).fetch()
}

// LESSWRONG version of getting unused slug by collection name. Modified to also include "oldSlugs" array
export const getUnusedSlugByCollectionName = async function (collectionName: CollectionNameWithSlug, slug: string, useOldSlugs = false, documentId?: string): Promise<string> {
  const collection = getCollection(collectionName);
  if (!collection.hasSlug()) {
    throw new Error(`Collection ${collection.collectionName} doesn't have a slug`);
  }
  return await getUnusedSlug(collection, slug, useOldSlugs, documentId)
};

export const slugIsUsed = async (collectionName: CollectionNameWithSlug, slug: string): Promise<boolean> => {
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

/**
 * Given an arbitrary object and a path into that object, where the result is presumed to exist and
 * be a string, recurse through that object getting the value at the given path. Eg
 *
 *     getAtPath({
 *       x: {
 *         y: {
 *           z: "asdf"
 *         },
 *       }
 *     }, ["x","y","z"])
 *
 * is "asdf". This is not as strong a typecheck as would be ideal; it might be possible to make
 * something stronger by replacing ThemePath with a type that manipulates T to assert that the path
 * exists as a string, but I (Jim) gave it a shot and didn't find a way to do that that worked.
 */
export const getAtPath = <T extends {}, V extends AnyBecauseHard>(
  data: T,
  path: (string | number)[],
): V | undefined => {
  if (!data) {
    return undefined;
  }
  return path.length < 2
    ? data[path[0] as keyof T] as V | undefined
    : getAtPath(data[path[0] as keyof T] as AnyBecauseHard, path.slice(1));
}

/**
 * Similar to `getAtPath`, but acts as a setter rather than a getter. See
 * `getAtPath` for details.
 */
export const setAtPath = <T extends {}, V extends AnyBecauseHard>(
  data: T,
  path: (string | number)[],
  value: V,
): V => {
  if (path.length < 2) {
    (data[path[0] as keyof T] as V) = value;
  } else {
    setAtPath(data[path[0] as keyof T] as AnyBecauseHard, path.slice(1), value);
  }
  return value;
}

/**
 * This is a workaround for a bug in apollo where setting `ssr: false` makes it not fetch
 * the query on the client (see https://github.com/apollographql/apollo-client/issues/5918)
 */
export const apolloSSRFlag = (ssr?: boolean) => ssr || !isServer;
