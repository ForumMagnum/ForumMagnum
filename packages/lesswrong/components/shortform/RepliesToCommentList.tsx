import React, { PureComponent } from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { useMulti } from '../../lib/crud/withMulti';
import { Comments } from "../../lib/collections/comments";
import { useCurrentUser } from '../common/withUser';
import { unflattenComments } from "../../lib/utils/unflatten";


const RepliesToCommentList = ({ terms, post, parentCommentId }) => {
  const { CommentsList, Loading } = Components;
  const currentUser = useCurrentUser();
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

