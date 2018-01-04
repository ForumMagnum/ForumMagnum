import { Components, registerComponent, withDocument, getRawComponent } from 'meteor/vulcan:core';
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';


class CommentInline extends getRawComponent('CommentsItem') {

  render() {
    const comment = this.props.comment;
    const htmlBody = {__html: comment.htmlBody};

    return (
      <div className="comment-inline">
        <div className="comment-inline-text content-body">
          <div className="comment-inline-description">
            In reply to <Components.UsersName user={comment.user} />&rsquo;s:
          </div>
          <blockquote>
            {htmlBody &&  <div className="comment-inline-body" dangerouslySetInnerHTML={htmlBody}></div>}
          </blockquote>
        </div>
      </div>
    )
  }
}

registerComponent('CommentInline', CommentInline);
