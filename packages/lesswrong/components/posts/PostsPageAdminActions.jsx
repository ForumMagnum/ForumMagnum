import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from "meteor/vulcan:users";

class PostsPageAdminActions extends Component {

  handleMoveToMeta = () => {
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {meta: true},
      unset: {
        frontpageDate: true,
        curatedDate: true,
      }
    })
  }

  handleMoveToFrontpage = () => {
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: { frontpageDate: new Date() },
      unset: {
        meta: true
      }
    })
  }

  handleMoveToPersonalBlog = () => {
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {},
      unset: {
        curatedDate: true,
        frontpageDate: true,
        meta: true
      }
    })
  }

  render() {
    const { currentUser, post } = this.props
    if (post && Users.canDo(currentUser, "posts.edit.all")) {
      return (
        <div className="posts-page-admin-actions-wrapper">
          <div className="posts-page-admin-more-options">...</div>
          <div className="posts-page-admin-actions">
            { !post.meta && <div onTouchTap={this.handleMoveToMeta }>
              Move to Meta
            </div>}
            { !post.frontpageDate && <div onTouchTap={this.handleMoveToFrontpage }>
              Move to Frontpage
            </div>}
            { (post.frontpageDate ||
               post.meta ||
               post.curatedDate) && <div onTouchTap={this.handleMoveToPersonalBlog }>
              Move to Personal Blog
            </div>}
            <Components.SuggestCurated post={post}/>
          </div>
        </div>
      )
    } else {
      return null
    }
  }
};

PostsPageAdminActions.displayName = "PostsPageAdminActions";

const withEditOptions = {
  collection: Posts,
  fragmentName: 'LWPostsList',
};


registerComponent(
  'PostsPageAdminActions',
  PostsPageAdminActions,
  [withEdit, withEditOptions],
  withCurrentUser
);
