import { useQuery, gql } from '@apollo/client'

export type PostAnalytics2Result = {
  views: number
  reads: number
  karma: number
  comments: number
  // TODO include regular post data here like title etc, for now we just have _id
  _id: string
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
