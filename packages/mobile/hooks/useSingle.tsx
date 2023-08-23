import { useQuery, gql, NetworkStatus } from "@apollo/client";

const query = gql`
  {
    post(input: {
      selector: {
        _id: "sWMwGNgpzPn7X9oSk"
      }
    }) {
      result {
        _id
        title
        slug
        postedAt
        curatedDate
        baseScore
        commentCount
        question
        url
        user {
          username
          slug
        }
      }
    }
  }
`;

export const useSingle = () => {
  const {
    data,
    error,
    loading,
    refetch,
    networkStatus,
  } = useQuery(query, {
  });
  const result = data?.post?.result;
  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    result,
    refetch,
    error,
  };
}
