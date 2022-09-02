import { ApolloError, gql, useQuery } from "@apollo/client";

const query = gql`
  query crosspostToken {
    crosspostToken: String
  }
`;

export const useCrosspostToken = () => {
  const { data, error, ...rest } = useQuery(query);
  console.log("result", data, error);

  return "";
}
