import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";

const GRAPHQL_API_URL = "https://forum.effectivealtruism.org/graphql";

const httpLink = new HttpLink({
  uri: GRAPHQL_API_URL,
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: httpLink,
});
