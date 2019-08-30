import { useMulti } from 'meteor/vulcan:core';
import { Posts } from '../../lib/collections/posts';

export const usePostBySlug = ({ slug }) => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "slugPost",
      slug: slug,
    },
    
    collection: Posts,
    queryName: 'PostsPageSlugQuery',
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

export const usePostByLegacyId = ({ legacyId }) => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdPost",
      legacyId: legacyId,
    },
    
    collection: Posts,
    queryName: 'PostsPageSlugQuery',
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
