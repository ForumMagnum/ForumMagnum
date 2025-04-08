import { ApolloClient, NormalizedCacheObject, InMemoryCache, ApolloLink } from '@apollo/client';
import { createHttpLink, createErrorLink, headerLink } from '../lib/apollo/links';
import type { FieldFunctionOptions } from '@apollo/client';

interface CacheReference {
  __ref: string;
}

// Type for the structure of items within the results array *in the cache*
// Nested items are likely references after normalization.
interface CachedUltraFeedResultItem {
  __typename: 'UltraFeedEntryType';
  type: 'feedPost' | 'feedCommentThread' | 'feedSpotlight';
  feedPost?: CacheReference | null; // Primarily expect Reference or null
  feedCommentThread?: CacheReference | null;
  feedSpotlight?: CacheReference | null;
}

// Define the key function logic directly here based on MixedTypeFeed
const ultraFeedKeyFunc = (result: CachedUltraFeedResultItem, readField: FieldFunctionOptions['readField']) => {
  let id: string | undefined;
  let objectRef: CacheReference | null | undefined;

  switch (result.type) {
    case 'feedPost':
      objectRef = result.feedPost;
      break;
    case 'feedCommentThread':
      objectRef = result.feedCommentThread;
      break;
    case 'feedSpotlight':
      objectRef = result.feedSpotlight;
      break;
  }

  if (objectRef) {
    id = readField<string>('_id', objectRef);
  }

  return `${result.type}_${id ?? 'undefined'}`;
};

export const createApolloClient = (baseUrl = '/'): ApolloClient<NormalizedCacheObject> => {
  const cache = new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          UltraFeed: {
            keyArgs: ["sessionId"],
            merge(existing, incoming, options) { 
              const { args, readField } = options;

              if (!incoming) return existing;
              
              const existingResults = existing ? existing.results : [];
              const existingKeys = new Set(existingResults.map((r: CachedUltraFeedResultItem) => ultraFeedKeyFunc(r, readField)));
              const incomingResults = incoming.results;

              const mergedResults = [...existingResults];
              let addedCount = 0;
              
              incomingResults.forEach((result: CachedUltraFeedResultItem) => {
                const key = ultraFeedKeyFunc(result, readField); // Pass readField
                if (!existingKeys.has(key)) {
                  mergedResults.push(result);
                  existingKeys.add(key);
                  addedCount++;
                }
              });

              const finalMergedKeys = new Set(mergedResults.map((r: CachedUltraFeedResultItem) => ultraFeedKeyFunc(r, readField)));
              const finalIds = mergedResults.map((r: CachedUltraFeedResultItem) => {
                 let objRef: CacheReference | null | undefined;
                 switch (r.type) {
                    case 'feedPost': objRef = r.feedPost; break;
                    case 'feedCommentThread': objRef = r.feedCommentThread; break;
                    case 'feedSpotlight': objRef = r.feedSpotlight; break;
                 }
                 return objRef ? readField<string>('_id', objRef) : undefined;
              });
              
              return {
                ...incoming, // Use incoming for cutoff, endOffset, sessionId etc.
                results: mergedResults,
              };
            },
          },
        },
      },
      FeedPost: {
        keyFields: ["_id"],
      },
      FeedCommentThread: {
        keyFields: ["_id"],
        fields: {
          comments: {
            merge(existing, incoming) {
              return incoming;
            }
          }
        }
      },
      FeedSpotlightItem: {
        keyFields: ["_id"],
      },
    }
  });

  const cachedState = baseUrl === '/' ? window.__APOLLO_STATE__ : window.__APOLLO_FOREIGN_STATE__;
  cache.restore(cachedState ?? ""); // ssr

  return new ApolloClient({
    link: ApolloLink.from([headerLink, createErrorLink(), createHttpLink(baseUrl)]),
    cache,
  });
};
