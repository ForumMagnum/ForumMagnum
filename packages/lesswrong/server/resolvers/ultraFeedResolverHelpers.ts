import { loadByIds } from '@/lib/loaders';
import { ServedEventData } from '@/components/ultraFeed/ultraFeedTypes';

/**
 * Load entities by IDs and create a Map for fast lookup, typed by collection name
 */
export async function loadEntitiesById<N extends CollectionNameString>(
  context: ResolverContext,
  collectionName: N,
  ids: string[]
): Promise<Map<string, ObjectsByCollectionName[N]>> {
  const results: Array<ObjectsByCollectionName[N] | null> = await loadByIds(context, collectionName, ids);
  const map = new Map<string, ObjectsByCollectionName[N]>();
  
  results.forEach(item => {
    if (item && item._id) {
      map.set(item._id, item);
    }
  });
  
  return map;
}

/**
 * Load multiple entity types in parallel and return Maps
 */
export async function loadMultipleEntitiesById(
  context: ResolverContext,
  entities: {
    posts?: string[];
    comments?: string[];
    spotlights?: string[];
  }
): Promise<{
  postsById: Map<string, DbPost>;
  commentsById: Map<string, DbComment>;
  spotlightsById: Map<string, DbSpotlight>;
}> {
  const [postsById, commentsById, spotlightsById] = await Promise.all([
    entities.posts?.length ? loadEntitiesById(context, 'Posts', entities.posts) : Promise.resolve(new Map<string, DbPost>()),
    entities.comments?.length ? loadEntitiesById(context, 'Comments', entities.comments) : Promise.resolve(new Map<string, DbComment>()),
    entities.spotlights?.length ? loadEntitiesById(context, 'Spotlights', entities.spotlights) : Promise.resolve(new Map<string, DbSpotlight>()),
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
    cutoff: cutoff ?? (results.length > 0 ? new Date() : null),
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


