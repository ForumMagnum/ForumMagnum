import React from 'react';
import { Components, registerComponent, useMulti, withEdit } from 'meteor/vulcan:core';
import { Comments } from '../../lib/collections/comments';
import withUser from '../common/withUser';

const RecentComments = ({currentUser, updateComment, terms}) => {
  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms,
    collection: Comments,
    queryName: 'selectCommentsListQuery',
    fragmentName: 'SelectCommentsList',
    enableTotal: false,
    pollInterval: 0,
    queryLimitName: "recentCommentsLimit"
  });
  if (!loadingInitial && results && !results.length) {
    return (<div>No comments found</div>)
  }
  if (loadingInitial || !results) {
    return <Components.Loading />
  }
  
  return (
    <div className="recent-comments-list">
      {results.map(comment =>
        <div key={comment._id}>
          <Components.CommentsNode
            currentUser={currentUser}
            comment={comment}
            post={comment.post}
            updateComment={updateComment}
            showPostTitle
          />
        </div>
      )}
      <Components.LoadMore {...loadMoreProps} />
    </div>
  )
}

registerComponent('RecentComments', RecentComments,
  [withEdit, {
    collection: Comments,
    fragmentName: 'SelectCommentsList',
  }],
  withUser
);
