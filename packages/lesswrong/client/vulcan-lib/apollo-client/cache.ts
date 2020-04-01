import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import introspectionQueryResultData from '../../../lib/vulcan-lib/fragmentTypes.json'

const fragmentMatcher = new IntrospectionFragmentMatcher({
  introspectionQueryResultData
})

const cache = new InMemoryCache({ fragmentMatcher })
  //ssr
  .restore((window as any).__APOLLO_STATE__);
export default cache;
