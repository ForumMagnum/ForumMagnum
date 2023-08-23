import { useQuery, gql, NetworkStatus } from "@apollo/client";

const query = gql`
  {
    posts(input: {
      terms: {
        view: "magic"
        limit: 10
        meta: null
        forum: true
      }
    }) {
      results {
        _id
        title
        slug
        pageUrl
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

export const useMulti = () => {
  const {
    data,
    error,
    loading,
    refetch,
    networkStatus,
  } = useQuery(query, {
  });
  const results = data?.posts?.results;
  return {
    loading: loading || networkStatus === NetworkStatus.fetchMore,
    loadingInitial: networkStatus === NetworkStatus.loading,
    loadingMore: networkStatus === NetworkStatus.fetchMore,
    results,
    refetch,
    error,
  };
}
