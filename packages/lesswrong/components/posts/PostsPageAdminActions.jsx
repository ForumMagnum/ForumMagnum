import {
  Components,
  registerComponent,
  withEdit,
} from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from "meteor/vulcan:users";
import withSetAlignmentPost from "../alignment-forum/withSetAlignmentPost.jsx";
import withUser from '../common/withUser';
import { withStyles } from '@material-ui/core/styles';
import MoreHorizIcon from '@material-ui/icons/MoreHoriz';

const styles = theme => ({
  root: {
    minHeight:75,
    "@media print": {
      display: "none"
    },
    '&:hover $actions': {
      display:"block"
    }
  },
  actionsIcon: {
    color: theme.palette.grey[400]
  },
  actions: {
    display: "none",
  }
})

class PostsPageAdminActions extends Component {

  handleMoveToMeta = () => {
    const { post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {meta: true, metaDate: new Date()},
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

  showAdminActions = () => {
    const { currentUser, post } = this.props
    return Users.canDo(currentUser, "posts.edit.all") ||
      Users.canMakeAlignmentPost(currentUser, post) ||
      Users.canSuggestPostForAlignment(currentUser, post)
  }

  render() {
    const { currentUser, post, classes } = this.props
    if (post && this.showAdminActions()) {
      return (
          <div className={classes.root}>
            <MoreHorizIcon className={classes.actionsIcon}/>
            <div className={classes.actions}>
              { Users.canDo(currentUser, "posts.edit.all") &&
                <span>
                  { !post.meta &&
                    <a onClick={this.handleMoveToMeta }>
                      Move to Meta
                    </a>
                  }
                  { !post.frontpageDate &&
                    <a onClick={this.handleMoveToFrontpage }>
                      Move to Frontpage
                    </a>
                  }
                  { (post.frontpageDate || post.meta || post.curatedDate) &&
                     <a onClick={this.handleMoveToPersonalBlog }>
                      Move to Personal Blog
                    </a>
                  }
                </span>
              }
              <Components.SuggestAlignment post={post} />
              { Users.canMakeAlignmentPost(currentUser, post) &&
                !post.af && <a onClick={this.handleMoveToAlignmentForum }>
                  Ω Make Alignment
              </a>}
              { Users.canMakeAlignmentPost(currentUser, post) && post.af &&
                <a onClick={this.handleRemoveFromAlignmentForum }>
                  Ω Remove Alignment
                </a>
              }
              <Components.SuggestCurated post={post} />
            </div>
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
  withUser,
  withStyles(styles, {name: "PostsPageAdminActions"})
);
