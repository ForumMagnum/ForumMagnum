import { Components, replaceComponent, withEdit } from 'meteor/vulcan:core';
import React from 'react';
import { FormattedMessage } from 'meteor/vulcan:i18n';
import { Comments } from "meteor/example-forum";

const CommentsList = ({
  comments,
  currentUser,
  highlightDate,
  editMutation,
  post,
  postEditMutation,
  frontPage
}) => {
  if (comments) {
    return (
      <div className="comments-list">
        {comments.map(comment =>
          <Components.CommentsNode
            currentUser={currentUser}
            comment={comment}
            key={comment._id}
            highlightDate={highlightDate}
            editMutation={editMutation}
            post={post}
            postEditMutation={postEditMutation}
            frontPage={frontPage}
            />)
        }
      </div>
    )
  } else {
    return (
      <div className="comments-list">
        <p>
          <FormattedMessage id="comments.no_comments"/>
        </p>
      </div>
    )
  }

};

CommentsList.displayName = "CommentsList";

const withEditOptions = {
  collection: Comments,
  fragmentName: 'CommentsList',
};


replaceComponent('CommentsList', CommentsList, [withEdit, withEditOptions]);
