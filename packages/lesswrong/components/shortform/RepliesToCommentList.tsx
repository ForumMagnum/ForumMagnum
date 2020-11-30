import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { unflattenComments } from "../../lib/utils/unflatten";


const RepliesToCommentList = ({ terms, post, parentCommentId }: {
  terms: CommentsViewTerms,
  post: PostsBase,
  parentCommentId: string,
}) => {
  const { CommentsList, Loading } = Components;
  const { loading, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: "CommentsList",
  });
  
  if (loading || !results)
    return <Loading/>
  
  const nestedComments = unflattenComments(results);
  return <CommentsList
    totalComments={results.length}
    comments={nestedComments}
    post={post}
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

