import { Components, registerComponent, withEdit, withCurrentUser } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from 'meteor/example-forum';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import FontIcon from 'material-ui/FontIcon';
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
    const { post, hover, anchorEl } = this.props
    if (post) {
      return (
        <Components.SunshineListItem>
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
            <Components.MetaInfo>
              { post.baseScore }
            </Components.MetaInfo>
            <Components.MetaInfo>
              <Link
                className="sunshine-sidebar-posts-author"
                to={Users.getProfileUrl(post.user)}>
                  {post.user.displayName}
              </Link>
            </Components.MetaInfo>
          </div>
          { hover && <Components.SidebarItemActions>
            <Link
              className="sunshine-sidebar-posts-action clear"
              target="_blank"
              title="Move to Drafts"
              to={Users.getProfileUrl(post.user)}
              onClick={this.handleDelete}>
                <FontIcon
                  style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                  className="material-icons">
                    clear
                </FontIcon>
                <div className="sunshine-sidebar-posts-item-delete-overlay"/>
            </Link>
            <span
              className="sunshine-sidebar-posts-action frontpage"
              title="Move to Frontpage"
              onClick={this.handleFrontpage}>
              <FontIcon
                style={{fontSize: "24px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  thumb_up
              </FontIcon>
            </span>
            <span
              className="sunshine-sidebar-posts-action review"
              title="Leave on Personal Blog"
              onClick={this.handleReview}>
              <FontIcon
                style={{fontSize: "18px", color:"rgba(0,0,0,.25)"}}
                className="material-icons">
                  done
              </FontIcon>
            </span>
          </Components.SidebarItemActions>}
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
