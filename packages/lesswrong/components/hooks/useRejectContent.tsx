import { useCallback } from 'react';
import { useCurrentUser } from '../common/withUser';
import { useUpdate } from '../../lib/crud/withUpdate';

export type RejectContentParams = {
  collectionName: "Posts",
  content: SunshinePostsList
} | {
  collectionName: "Comments",
  content: CommentsList | CommentsListWithParentMetadata
}

export function useRejectContent ({collectionName, content}: RejectContentParams) {
  const fragmentName = collectionName === "Posts" ? "SunshinePostsList" : "CommentsListWithParentMetadata"
  const { mutate: updateContent } = useUpdate({
    collectionName,
    fragmentName
  });
  
  const rejectContent = useCallback((reason: string) => {
    void updateContent({
      selector: { _id: content._id },
      data: { rejected: true, rejectedReason: reason }
    });
  }, [updateContent, content._id]);
  
  const unrejectContent = useCallback(() => {
    void updateContent({
      selector: { _id: content._id },
      data: { rejected: false }
    });
  }, [updateContent, content._id])
  
  return {rejectContent, unrejectContent} 
}


