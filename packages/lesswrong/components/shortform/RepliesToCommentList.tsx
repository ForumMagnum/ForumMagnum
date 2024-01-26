import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from "../../lib/utils/unflatten";


const RepliesToCommentList = ({ post, parentCommentId, directReplies = false }: {
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


const RepliesToCommentListComponent = registerComponent('RepliesToCommentList', RepliesToCommentList)

declare global {
  interface ComponentTypes {
    RepliesToCommentList: typeof RepliesToCommentListComponent
  }
}

