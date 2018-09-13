import { Components, registerComponent } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
import moment from 'moment';
import withUser from '../common/withUser';

class SunshineCommentsItemOverview extends Component {

  render () {
    const { comment } = this.props
    let commentExcerpt = comment.body.substring(0,40);
    if (comment) {
      return (
        <div className="sunshine-sidebar-posts-item new-comment">
          <Components.MetaInfo>
            <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
              { comment.deleted ? <span>COMMENT DELETED</span>
                : <span>{ commentExcerpt }</span>
              }
            </Link>
          </Components.MetaInfo>
          <div>
            <Components.MetaInfo>
              { comment.baseScore }
            </Components.MetaInfo>
            <Components.MetaInfo>
              <Link
                className="sunshine-sidebar-posts-author"
                to={Users.getProfileUrl(comment.user)}>
                  {comment.user.displayName}
              </Link>
            </Components.MetaInfo>
            <Components.MetaInfo>
              <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
                {moment(new Date(comment.postedAt)).fromNow()}
                <FontIcon className="material-icons comments-item-permalink"> link </FontIcon>
              </Link>
            </Components.MetaInfo>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

registerComponent('SunshineCommentsItemOverview', SunshineCommentsItemOverview, withUser);
