import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import Typography from '@material-ui/core/Typography';
import withHover from '../common/withHover'
import Popper from '@material-ui/core/Popper';

class SunshineNewPostsItem extends Component {

  handleReview = () => {
    const { currentUser, post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {reviewedByUserId: currentUser._id},
      unset: {}
    })
  }

  handleFrontpage = () => {
    const { currentUser, post, editMutation } = this.props
    editMutation({
      documentId: post._id,
      set: {
        frontpageDate: new Date(),
        reviewedByUserId: currentUser._id
      },
      unset: {}
    })
  }

  handleDelete = () => {
    const { editMutation, post } = this.props
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      window.open(Users.getProfileUrl(post.user), '_blank');
      editMutation({
        documentId: post._id,
        set: {
          draft: true,
        },
        unset: {}
      })
    }
  }

  render () {
    const { post, hover, anchorEl } = this.props
    if (post) {
      return (
        <Components.SunshineListItem hover={hover}>
          <Popper open={hover} anchorEl={anchorEl} placement="left-start">
            <Components.SidebarHoverOver>
              <Typography variant="title">
                <Link to={Posts.getPageUrl(post)}>
                  { post.title }
                </Link>
              </Typography>
              <br/>
              <Components.PostsHighlight post={post}/>
            </Components.SidebarHoverOver>
          </Popper>
          <Link to={Posts.getPageUrl(post)}>
              {post.title}
          </Link>
          <div>
            <Components.SidebarInfo>
              { post.baseScore }
            </Components.SidebarInfo>
            <Components.SidebarInfo>
              <Link
                className="sunshine-sidebar-posts-author"
                to={Users.getProfileUrl(post.user)}>
                  {post.user.displayName}
              </Link>
            </Components.SidebarInfo>
          </div>
          { hover && <Components.SidebarActionMenu>
            <Components.SidebarAction title="Leave on Personal Blog" onClick={this.handleReview}>
              done
            </Components.SidebarAction>
            <Components.SidebarAction title="Move to Frontpage" onClick={this.handleFrontpage}>
              thumb_up
            </Components.SidebarAction>
            <Components.SidebarAction title="Move to Drafts" onClick={this.handleDelete} warningHighlight>
              clear
            </Components.SidebarAction>
          </Components.SidebarActionMenu>}
        </Components.SunshineListItem>
      )
    } else {
      return null
    }
  }
}

const withEditOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}
registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, [withEdit, withEditOptions], withCurrentUser, withHover);
