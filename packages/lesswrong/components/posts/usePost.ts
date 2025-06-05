import { ApolloError } from '@apollo/client';
import { useQuery } from "@/lib/crud/useQuery"
import { gql } from "@/lib/generated/gql-codegen/gql";

const PostsPageMultiQuery = gql(`
  query multiPostusePostQuery($selector: PostSelector, $limit: Int, $enableTotal: Boolean) {
    posts(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...PostsPage
      }
      totalCount
    }
  }
`);

export const usePostBySlug = ({slug, ssr=true}: {slug: string, ssr?: boolean}):
  {
    post: PostsPage,
    loading: false,
    error: null
  } | {
    post: null,
    loading: boolean,
    error: ApolloError|null,
  } => {
  const { data, error, loading } = useQuery(PostsPageMultiQuery, {
    variables: {
      selector: { slugPost: { slug: slug } },
      limit: 1,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
    ssr,
  });

  const results = data?.posts?.results;
  
  if (results && results.length>0 && results[0]._id) {
    return {
      post: results[0],
      loading: false,
      error: null
    };
  } else {
    return {
      post: null,
      loading,
      error: error||null,
    }
  }
}

export const usePostByLegacyId = ({ legacyId, ssr=true }: {
  legacyId: string
  ssr?: boolean
}):
  {
    post: PostsPage,
    loading: false,
    error: null
  } | {
    post: null,
    loading: boolean,
    error: ApolloError|null,
  } => {
  const { data: dataPostsPage, error, loading } = useQuery(PostsPageMultiQuery, {
    variables: {
      selector: { legacyIdPost: { legacyId: legacyId } },
      limit: 1,
      enableTotal: false,
    },
    notifyOnNetworkStatusChange: true,
    ssr,
  });

  const results = dataPostsPage?.posts?.results;
  
  if (results && results.length>0 && results[0]._id) {
    return {
      post: results[0],
      loading: false,
      error: null
    };
  } else {
    return {
      post: null,
      loading,
      error: error||null,
    }
  }
}
