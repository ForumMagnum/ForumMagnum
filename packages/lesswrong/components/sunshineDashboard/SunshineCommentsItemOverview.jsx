import { Components, registerComponent, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Comments, Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';

class SunshineCommentsItemOverview extends Component {

  render () {
    const comment = this.props.comment
    let commentExcerpt = comment.body.substring(0,40);
    if (comment) {
      return (
        <div className="sunshine-sidebar-posts-item new-comment">
          <div className="sunshine-sidebar-comment-excerpt">
            <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
              { comment.deleted ? <div>COMMENT DELETED</div>
                : <div>{ commentExcerpt }</div>
              }
            </Link>
          </div>
          <div className="sunshine-sidebar-content-hoverover">
            <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
              Commented on post: <strong>{ comment.post.title }</strong>
            </Link>
            <div dangerouslySetInnerHTML={{__html:comment.htmlBody}} />
          </div>
          <div className="sunshine-sidebar-item-meta">
            <span className="karma">
              { comment.baseScore }
            </span>
            <Link
              className="sunshine-sidebar-posts-author"
              to={Users.getProfileUrl(comment.user)}>
                {comment.user.displayName}
            </Link>
            { comment.post && (
              <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                {moment(new Date(comment.postedAt)).fromNow()}
                <FontIcon className="material-icons comments-item-permalink"> link </FontIcon>
              </Link>
            )}
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

registerComponent('SunshineCommentsItemOverview', SunshineCommentsItemOverview, withCurrentUser);
