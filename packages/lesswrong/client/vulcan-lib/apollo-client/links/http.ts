import { BatchHttpLink } from 'apollo-link-batch-http';

const httpLink = new BatchHttpLink({
  uri: '/graphql',
  credentials: 'same-origin',
});
export default httpLink;
