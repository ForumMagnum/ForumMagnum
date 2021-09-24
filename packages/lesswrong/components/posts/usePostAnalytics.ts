import { useQuery, gql } from '@apollo/client'

export type PostAnalyticsResult = {
  uniqueClientViews: number
  uniqueClientViews10Sec: number
}

type PostAnalyticsQueryResult = {
  PostAnalytics: PostAnalyticsResult
}

export const usePostAnalytics = (postId: string) => {
  const postAnalyticsQuery = gql`
    query PostAnalyticsQuery($postId: String!) {
      PostAnalytics(postId: $postId) {
        uniqueClientViews
        uniqueClientViews10Sec
      }
    }
  `
  
  const { data, loading, error } = useQuery<PostAnalyticsQueryResult>(postAnalyticsQuery, {variables: {postId}, ssr: true})
  
  return {
    postAnalytics: data?.PostAnalytics,
    loading, error
  }
}
