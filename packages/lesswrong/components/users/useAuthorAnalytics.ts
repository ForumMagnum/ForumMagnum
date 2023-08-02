import { useQuery, gql } from '@apollo/client'

export type PostAnalytics2Result = {
  _id: string
  title: string
  slug: string
  postedAt: Date
  views: number
  reads: number
  karma: number
  comments: number
}

export type AuthorAnalyticsResult = {
  posts: PostAnalytics2Result[]
  // TODO overall series for the graph
}

type AuthorAnalyticsQueryResult = {
  AuthorAnalytics: AuthorAnalyticsResult
}

export const useAuthorAnalytics = (userId?: string) => {
  const AuthorAnalyticsQuery = gql`
    query AuthorAnalyticsQuery($userId: String!) {
      AuthorAnalytics(userId: $userId) {
        posts {
          _id
          title
          slug
          postedAt
          views
          reads
          karma
          comments
        }
      }
    }
  `

  const { data, loading, error } = useQuery<AuthorAnalyticsQueryResult>(AuthorAnalyticsQuery, {
    variables: { userId },
    skip: !userId,
  });
  
  return {
    authorAnalytics: data?.AuthorAnalytics,
    loading, error
  }
}
