import React, { PureComponent } from 'react';
import { Components, registerComponent, withList } from 'meteor/vulcan:core';
import { Comments } from "../../lib/collections/comments";
import withUser from '../common/withUser';
import { unflattenComments } from "../../lib/modules/utils/unflatten";


class RepliesToCommentList extends PureComponent {
  render() {
    const { loading, results, post, currentUser, parentCommentId } = this.props;
    const { CommentsList, Loading } = Components;
    
    if (loading || !results)
      return <Loading/>
    
    const nestedComments = unflattenComments(results);
    return <CommentsList
      currentUser={currentUser}
      totalComments={results.length}
      comments={nestedComments}
      post={post}
      startThreadTruncated={true}
      defaultNestingLevel={2}
      parentCommentId={parentCommentId}
    />
  }
}


registerComponent('RepliesToCommentList', RepliesToCommentList,
  withUser,
  [withList, {
    collection: Comments,
    queryName: "RepliesToCommentQuery",
    fragmentName: "CommentsList",
    ssr: true,
  }],
)
