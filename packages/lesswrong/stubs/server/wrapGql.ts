import { gql as wrappedGql } from "@/lib/generated/gql-codegen/gql";

// TODO Replace with graphql-tag parser combined with something that adds fragments
export const gql = (graphqlString: string): DocumentNode => {
  const subfragments = getSubfragmentNamesIn(graphqlString);
  // TODO
}
