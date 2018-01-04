import { Components, registerComponent, withDocument } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Comments } from 'meteor/example-forum';

const CommentWithContextWrapper = ({ document, currentUser}) =>{
  if (document) {
    return (
      <div className="comment-wrapper">
        <Components.CommentWithContext comment={document} currentUser={currentUser} />
      </div>
    )
  } else {
    return (
      <div className="comment-wrapper">
        <Components.Loading />
      </div>
    )
  }

}


const options = {
  collection: Comments,
  queryName: 'CommentWithContextQuery',
  fragmentName: 'CommentsList',
};

registerComponent('CommentWithContextWrapper', CommentWithContextWrapper, [withDocument, options]);
