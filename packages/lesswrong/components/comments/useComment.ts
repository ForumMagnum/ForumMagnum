import { useMulti } from '../../lib/crud/withMulti';
import { isValidBase36Id } from '../../lib/utils/base36id';

export const useCommentByLegacyId = ({ legacyId }: { legacyId: string }): {
  comment: CommentsList|null,
  loading: boolean,
  error: any,
}=> {
  const isValidId = isValidBase36Id(legacyId);
  
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdComment",
      legacyId: legacyId,
    },
    
    skip: !isValidId,
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    limit: 1,
    enableTotal: false,
  });
  
  if (!isValidId) {
    return {
      comment: null,
      loading: false,
      error: "Invalid ID"
    };
  } else if (results && results.length>0 && results[0]._id) {
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
