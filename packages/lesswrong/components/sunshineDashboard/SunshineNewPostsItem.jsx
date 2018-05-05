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
        <div className="sunshine-new-posts-item">
          <Link to={Posts.getPageUrl(post)}
            className="sunshine-new-posts-title">
              {post.title}
          </Link>
          <div className="sunshine-new-posts-meta">
            <Link
              className="sunshine-new-posts-author"
              to={Users.getProfileUrl(post.user)}>
                {post.user.displayName}
            </Link>
            <div className="posts-item-vote">
              <Components.Vote
                collection={Posts}
                document={post}
                currentUser={this.props.currentUser}/>
            </div>
          </div>
          <div className="sunshine-new-posts-actions">
            <Link
              className="sunshine-new-posts-action clear"
              target="_blank"
              to={Users.getProfileUrl(post.user)}
              onTouchTap={this.handleDelete}>
                <FontIcon
                  style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                  className="material-icons">
                    clear
                </FontIcon>
                <div className="sunshine-new-posts-item-delete-overlay">

                </div>
            </Link>
            <span
              className="sunshine-new-posts-action frontpage"
              onTouchTap={this.handleFrontpage}>
              <FontIcon
                style={{fontSize: "24px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  supervisor_account
              </FontIcon>
            </span>
            <span
              className="sunshine-new-posts-action review"
              onTouchTap={this.handleReview}>
              <FontIcon
                style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  thumb_up
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
