import { ApolloClient, HttpLink, InMemoryCache } from "@apollo/client";
import { GRAPHQL_API_URL } from "./config";

const httpLink = new HttpLink({
  uri: GRAPHQL_API_URL,
});

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link: httpLink,
});
