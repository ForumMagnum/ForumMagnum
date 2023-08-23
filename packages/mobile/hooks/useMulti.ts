import { useQuery, gql, NetworkStatus } from "@apollo/client";

const query = gql`
  {
    posts(input: {
      terms: {
        view: "top"
        limit: 50
        meta: null
      }
    }) {
      results {
        _id
        title
        slug
        pageUrl
        postedAt
        baseScore
        voteCount
        commentCount
        meta
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

export const useMulti = () => {
  const {
    data,
    error,
    loading,
    refetch,
    networkStatus,
  } = useQuery(query, {
  });
  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    results: data,
    refetch,
    error,
  };
}
