import { useMulti } from '../../lib/crud/withMulti';

export const useCommentByLegacyId = ({ legacyId }: { legacyId: string }): {
  comment: CommentsList|null,
  loading: boolean,
  error: any,
}=> {
  const { results, loading, error } = useMulti({
    terms: {
      view: "legacyIdComment",
      legacyId: legacyId,
    },
    
    collectionName: "Comments",
    fragmentName: 'CommentsList',
    limit: 1,
    enableTotal: false,
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
