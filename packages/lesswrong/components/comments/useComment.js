import { useMulti } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments/collection.js';

export const useCommentByLegacyId = ({ legacyId }) => {
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdComment",
      legacyId: legacyId,
    },
    
    collection: Comments,
    queryName: 'CommentByLegacyId',
    fragmentName: 'CommentsList',
    limit: 1,
    enableTotal: false,
    ssr: true,
  });
  
  if (results && results.length>0 && results[0]._id) {
    return {
      comment: results[0],
      loading: false,
      error: null
    };
  } else {
    return {
      comment: null,
      loading, error
    }
  }
}
