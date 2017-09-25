import { Components, replaceComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

const CommentsNode = ({ comment, currentUser, newComment, editMutation}) =>
  <div className={newComment ? "comment-new" : "comment-old"}>
    <div className={"comments-node"}>
      <Components.CommentsItem
        currentUser={currentUser}
        comment={comment}
        key={comment._id}
        editMutation={editMutation}
      />
      {comment.childrenResults ?
        <div className="comments-children">
          {comment.childrenResults.map(comment =>
            <CommentsNode currentUser={currentUser}
              comment={comment}
              key={comment._id}
              newComment={newComment}
              editMutation={editMutation}
            />)}
        </div>
        : null
      }
    </div>
  </div>

CommentsNode.propTypes = {
  comment: PropTypes.object.isRequired, // the current comment
};

replaceComponent('CommentsNode', CommentsNode);
