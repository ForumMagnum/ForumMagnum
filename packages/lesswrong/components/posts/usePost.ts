import { useMulti } from '../../lib/crud/withMulti';
import { Posts } from '../../lib/collections/posts';

export const usePostBySlug = ({slug}: {slug: string}):
  {
    post: PostsPage|null,
    loading: false,
    error: null
  } | {
    post: null,
    loading: true,
    error: any
  } => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "slugPost",
      slug: slug,
    },
    
    collection: Posts,
    fragmentName: 'PostsPage',
    limit: 1,
    enableTotal: false,
    ssr: true,
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
      loading, error
    }
  }
}

export const usePostByLegacyId = ({ legacyId }: {legacyId: string}):
  {
    post: PostsPage|null,
    loading: false,
    error: null
  } | {
    post: null,
    loading: true,
    error: any
  } => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdPost",
      legacyId: legacyId,
    },
    
    collection: Posts,
    fragmentName: 'PostsPage',
    limit: 1,
    enableTotal: false,
    ssr: true,
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
      loading, error
    }
  }
}
