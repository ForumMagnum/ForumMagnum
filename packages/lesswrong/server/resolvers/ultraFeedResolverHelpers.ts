import { loadByIds } from '@/lib/loaders';
import { accessFilterMultiple } from '@/lib/utils/schemaUtils';
import { ServedEventData } from '@/components/ultraFeed/ultraFeedTypes';

/**
 * A permissions-filtered entity. Filtering can remove any field except `_id`.
 */
export type FilteredEntity<T extends DbObject> = Partial<T> & { _id: string };

/**
 * Load entities by IDs and create a Map for fast lookup, typed by collection name.
 * Entities are permissions-filtered for the current user: ones they can't access
 * are left out of the Map, and fields they can't read are removed.
 */
export async function loadEntitiesById<N extends CollectionNameString>(
  context: ResolverContext,
  collectionName: N,
  ids: string[]
): Promise<Map<string, FilteredEntity<ObjectsByCollectionName[N]>>> {
  const results: Array<ObjectsByCollectionName[N] | null> = await loadByIds(context, collectionName, ids);
  const filteredResults = await accessFilterMultiple(context.currentUser, collectionName, results, context);
  const map = new Map<string, FilteredEntity<ObjectsByCollectionName[N]>>();

  filteredResults.forEach(item => {
    const { _id } = item;
    if (_id) {
      map.set(_id, { ...item, _id });
    }
  });

  return map;
}

/**
 * Load multiple entity types in parallel and return Maps. See loadEntitiesById
 * for the permissions filtering this applies.
 */
export async function loadMultipleEntitiesById(
  context: ResolverContext,
  entities: {
    posts?: string[];
    comments?: string[];
    spotlights?: string[];
  }
): Promise<{
  postsById: Map<string, FilteredEntity<DbPost>>;
  commentsById: Map<string, FilteredEntity<DbComment>>;
  spotlightsById: Map<string, FilteredEntity<DbSpotlight>>;
}> {
  const [postsById, commentsById, spotlightsById] = await Promise.all([
    entities.posts?.length ? loadEntitiesById(context, 'Posts', entities.posts) : Promise.resolve(new Map<string, FilteredEntity<DbPost>>()),
    entities.comments?.length ? loadEntitiesById(context, 'Comments', entities.comments) : Promise.resolve(new Map<string, FilteredEntity<DbComment>>()),
    entities.spotlights?.length ? loadEntitiesById(context, 'Spotlights', entities.spotlights) : Promise.resolve(new Map<string, FilteredEntity<DbSpotlight>>()),
  ]);

  return { postsById, commentsById, spotlightsById };
}

export type UltraFeedEventInsertData = Pick<DbUltraFeedEvent, '_id' | 'userId' | 'eventType' | 'collectionName' | 'documentId'> & { 
  event?: ServedEventData | any;
};




/**
 * Create UltraFeedQueryResults response object
 */
export function createUltraFeedResponse<T>(
  results: T[],
  offset: number,
  sessionId: string | null,
  cutoff?: Date | null
): {
  __typename: 'UltraFeedQueryResults';
  cutoff: Date | null;
  endOffset: number;
  results: T[];
  sessionId: string | null;
} {
  return {
    __typename: 'UltraFeedQueryResults' as const,
    cutoff: cutoff === undefined ? (results.length > 0 ? new Date() : null) : cutoff,
    endOffset: offset + results.length,
    results,
    sessionId
  };
}

/**
 * Optionally insert a subscription suggestions entry into an array, at a random position
 * after a minimum index. Returns a new array if inserted, otherwise the original array.
 */
export function insertSubscriptionSuggestions<T>(
  items: T[],
  createEntry: () => T,
  probability: number = 0.2,
  minInsertIndex: number = 4,
): T[] {
  if (items.length === 0 || Math.random() > probability) {
    return items;
  }

  const maxStart = Math.max(items.length - minInsertIndex, 1);
  const insertPosition = Math.floor(Math.random() * maxStart) + minInsertIndex;
  const result = [...items];
  result.splice(Math.min(insertPosition, result.length), 0, createEntry());
  return result;
}


