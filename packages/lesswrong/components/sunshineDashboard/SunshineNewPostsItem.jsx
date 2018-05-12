import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';

class SunshineNewPostsItem extends Component {

  handleReview = () => {
    this.props.editMutation({
      documentId: this.props.post._id,
      set: {reviewed: true},
      unset: {}
    })
  }

  handleFrontpage = () => {
    this.props.editMutation({
      documentId: this.props.post._id,
      set: {
        frontpageDate: new Date(),
        reviewed: true
      },
      unset: {}
    })
  }

  handleDelete = () => {
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      this.props.editMutation({
        documentId: this.props.post._id,
        set: {
          draft: true,
        },
        unset: {}
      })
    }
  }

  render () {
    if (this.props.post) {
      const post = this.props.post
      return (
        <div className="sunshine-sidebar-item new-post">
          <Link to={Posts.getPageUrl(post)}
            className="sunshine-sidebar-posts-title">
              {post.title}
          </Link>
          <div className="sunshine-sidebar-item-meta">
            <span className="karma">
              { post.baseScore }
            </span>
            <Link
              className="sunshine-sidebar-posts-author"
              to={Users.getProfileUrl(post.user)}>
                {post.user.displayName}
            </Link>
          </div>
          <div className="sunshine-sidebar-posts-actions new-post">
            <Link
              className="sunshine-sidebar-posts-action clear"
              target="_blank"
              title="Move to Drafts"
              to={Users.getProfileUrl(post.user)}
              onTouchTap={this.handleDelete}>
                <FontIcon
                  style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                  className="material-icons">
                    clear
                </FontIcon>
                <div className="sunshine-sidebar-posts-item-delete-overlay">

                </div>
            </Link>
            <span
              className="sunshine-sidebar-posts-action frontpage"
              title="Move to Frontpage"
              onTouchTap={this.handleFrontpage}>
              <FontIcon
                style={{fontSize: "24px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  thumb_up
              </FontIcon>
            </span>
            <span
              className="sunshine-sidebar-posts-action review"
              title="Leave on Personal Blog"
              onTouchTap={this.handleReview}>
              <FontIcon
                style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  done
              </FontIcon>
            </span>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
}

const withEditOptions = {
  collection: Posts,
  fragmentName: 'LWPostsList',
}
registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, [withEdit, withEditOptions], withCurrentUser);
