/**
 * Watched mutations allow to update the cache based on a MutationSuccess
 * E.g. if the user juste created a Todo, we can update the cached Todo list
 * @see https://github.com/haytko/apollo-link-watched-mutation
 */
import WatchedMutationLink from 'apollo-link-watched-mutation';
import { WatchedMutations } from '../updates';
import { addCallback } from '../../../modules/callbacks'
import cache from '../cache';


// In `apollo-link-watched-mutation` queries are only tracked after they are made,
// and there is no functionality to restore the queries that were made only in SSR.
// The code below iterates over the cache and ensures that all queries are actually
// being tracked by the watched mutations system.

// To ensure that the store is properly initialized and the React tree hydrated we
// register it as a callback that fires right after hydration finishes

// Code modified from: https://github.com/haytko/apollo-link-watched-mutation/issues/24
const watchedMutation = new WatchedMutationLink(cache, WatchedMutations);
const addPreviouslyTrackedWatches = () => {
  const previouslyTrackedWatches = Array.from(cache.watches)
    .map((watch) => {
      return {
        name: getQueryName(watch.query),
        query: watch.query,
        variables: watch.variables,
      };
    })
    .filter(trackedWatch => {
      return trackedWatch.name;
    });
  previouslyTrackedWatches.forEach(trackedWatch => {
    watchedMutation.addRelatedQuery(trackedWatch.name, {
      query: trackedWatch.query,
      variables: trackedWatch.variables,
    });
  });
}
addCallback('client.hydrate.after', addPreviouslyTrackedWatches)

function getQueryName(query) {
  if (query.kind !== "Document") {
    return null;
  }

  if (query.definitions.length > 0) {
    const operation = query.definitions.find(definition => {
      return definition.kind === "OperationDefinition";
    });

    if (operation && operation.name) {
      return operation.name.value;
    }
  }

  return null;
}

export default watchedMutation
