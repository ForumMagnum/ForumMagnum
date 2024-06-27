import { useQueryWrapped } from '@/lib/crud/useQuery'
import { gql } from '@apollo/client'

export type PostAnalyticsResult = {
  allViews: number
  uniqueClientViews: number
  uniqueClientViews10Sec: number
  uniqueClientViews5Min: number
  medianReadingTime: number
  uniqueClientViewsSeries: {date: Date, uniqueClientViews: number}[]
}

type PostAnalyticsQueryResult = {
  PostAnalytics: PostAnalyticsResult
}

export const usePostAnalytics = (postId: string) => {
  const postAnalyticsQuery = gql`
    query PostAnalyticsQuery($postId: String!) {
      PostAnalytics(postId: $postId) {
        allViews
        uniqueClientViews
        uniqueClientViews10Sec
        medianReadingTime
        uniqueClientViews5Min
        uniqueClientViewsSeries {
          date
          uniqueClientViews
        }
      }
    }
  `
  
  const { data, loading, error } = useQueryWrapped<PostAnalyticsQueryResult>(postAnalyticsQuery, {variables: {postId}})
  
  return {
    postAnalytics: data?.PostAnalytics,
    loading, error
  }
}
