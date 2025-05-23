import { useMulti } from '../../lib/crud/withMulti';
import { ApolloError } from '@apollo/client';

export const usePostBySlug = ({slug}: {slug: string}):
  {
    post: PostsPage,
    loading: false,
    error: null
  } | {
    post: null,
    loading: boolean,
    error: ApolloError|null,
  } => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "slugPost",
      slug: slug,
    },
    
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    limit: 1,
    enableTotal: false,
  });
  
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

export const usePostByLegacyId = ({ legacyId }: {legacyId: string}):
  {
    post: PostsPage,
    loading: false,
    error: null
  } | {
    post: null,
    loading: boolean,
    error: ApolloError|null,
  } => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdPost",
      legacyId: legacyId,
    },
    
    collectionName: "Posts",
    fragmentName: 'PostsPage',
    limit: 1,
    enableTotal: false,
  });
  
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
