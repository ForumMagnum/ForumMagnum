import { useQuery, gql } from '@apollo/client';

export type PostMetricsResult = {
  uniqueClientViews: number
};

type PostMetricsQueryResult = {
  PostMetrics: PostMetricsResult
}

export const usePostMetrics = (postId: string) => {
  const postMetricsQuery = gql`
    query PostMetricsQuery($postId: String!) {
      PostMetrics(postId: $postId) {
        uniqueClientViews
      }
    }
  `;
  
  const { data, loading, error } = useQuery<PostMetricsQueryResult>(postMetricsQuery, {variables: {postId}, ssr: true});
  
  return {
    postMetrics: data?.PostMetrics,
    loading, error
  };
}
