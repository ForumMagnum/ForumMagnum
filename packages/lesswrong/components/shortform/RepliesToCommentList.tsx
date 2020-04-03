import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from "../../lib/collections/comments";
import { unflattenComments } from "../../lib/utils/unflatten";


const RepliesToCommentList = ({ terms, post, parentCommentId }: {
  terms: any,
  post: PostsBase,
  parentCommentId: string,
}) => {
  const { CommentsList, Loading } = Components;
  const { loading, results } = useMulti({
    terms,
    collection: Comments,
    fragmentName: "CommentsList",
    ssr: true,
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

