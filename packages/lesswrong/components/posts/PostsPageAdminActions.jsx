import {
  Components,
  registerComponent,
  withEdit,
  withCurrentUser
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from "meteor/vulcan:users";
import withSetAlignmentPost from "../alignmentForum/withSetAlignmentPost";

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

  handleMoveToAlignmentForum = () => {
    const { post, setAlignmentPostMutation } = this.props
    setAlignmentPostMutation({
      postId: post._id,
      af: true,
    })
  }

  handleRemoveFromAlignmentForum = () => {
    const { post, setAlignmentPostMutation } = this.props
    setAlignmentPostMutation({
      postId: post._id,
      af: false,
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
    if (post) {
      return (
        <div className="posts-page-admin-actions-wrapper">
          { Users.canMakeAlignmentPost(currentUser, post) &&
            !post.af && <div className="posts-page-admin-action"
              onClick={this.handleMoveToAlignmentForum }>
            Make Alignment Post
          </div>}
          { Users.canMakeAlignmentPost(currentUser, post) &&
            post.af && <div className="posts-page-admin-action"
              onClick={this.handleRemoveFromAlignmentForum }>
            Remove Alignment Post
          </div>}
          { Users.canDo(currentUser, "posts.edit.all") &&
            <div>
              <div className="posts-page-admin-more-options">...</div>
              <div className="posts-page-admin-actions">
                { !post.meta && <div className="posts-page-admin-action" onClick={this.handleMoveToMeta }>
                  Move to Meta
                </div>}
                { !post.frontpageDate && <div className="posts-page-admin-action" onClick={this.handleMoveToFrontpage }>
                  Move to Frontpage
                </div>}
                { (post.frontpageDate ||
                   post.meta ||
                   post.curatedDate) && <div className="posts-page-admin-action" onClick={this.handleMoveToPersonalBlog }>
                  Move to Personal Blog
                </div>}
                <Components.SuggestCurated post={post}/>
              </div>
            </div>
         }
        </div>
      )
    } else {
      return null
    }
  }
}

PostsPageAdminActions.displayName = "PostsPageAdminActions";

const withEditOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
};

const setAlignmentOptions = {
  fragmentName: "PostsList"
}


registerComponent(
  'PostsPageAdminActions',
  PostsPageAdminActions,
  [withEdit, withEditOptions],
  [withSetAlignmentPost, setAlignmentOptions],
  withCurrentUser
);
