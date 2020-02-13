/**
 * Setup apollo-link-state
 * Apollo-link-state helps to manage a local store for caching and client-side
 * data storing
 * It replaces previous implementation using redux
 * Link state doc:
 * @see https://www.apollographql.com/docs/react/essentials/local-state.html
 * @see https://www.apollographql.com/docs/link/links/state.html
 * General presentation on Links
 * @see https://www.apollographql.com/docs/link/
 * Example
 * @see https://hackernoon.com/storing-local-state-in-react-with-apollo-link-state-738f6ca45569
 */
import { withClientState } from 'apollo-link-state';

export const createStateLink = ({ cache, resolvers, defaults, ...otherOptions }: any) => {
  const stateLink = withClientState({
    cache,
    defaults: defaults || {},
    resolvers: resolvers || { Mutation: {} },
    ...otherOptions,
  });
  return stateLink;
};
