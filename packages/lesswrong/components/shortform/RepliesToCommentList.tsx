import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from "../../lib/utils/unflatten";


const RepliesToCommentListInner = ({ post, parentCommentId, directReplies = false }: {
  post: PostsBase,
  parentCommentId: string,
  directReplies?: boolean
}) => {
  const { CommentsList, Loading } = Components;
  const terms: CommentsViewTerms = directReplies ? {
    view: "commentReplies",
    parentCommentId,
    limit: 500
  } : {
    view: "repliesToCommentThread",
    topLevelCommentId: parentCommentId,
    limit: 500,
  }
  const { loading, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  
  if (loading || !results)
    return <Loading/>
  
  const nestedComments = unflattenComments(results);
  return <CommentsList
    treeOptions={{
      post,
    }}
    totalComments={results.length}
    comments={nestedComments}
    startThreadTruncated={true}
    defaultNestingLevel={2}
    parentCommentId={parentCommentId}
  />
}


export const RepliesToCommentList = registerComponent('RepliesToCommentList', RepliesToCommentListInner)

declare global {
  interface ComponentTypes {
    RepliesToCommentList: typeof RepliesToCommentList
  }
}

