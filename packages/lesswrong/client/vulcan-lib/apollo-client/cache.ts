import { InMemoryCache } from 'apollo-cache-inmemory';

const cache = new InMemoryCache({})
  //ssr
  .restore((window as any).__APOLLO_STATE__);
export default cache;
