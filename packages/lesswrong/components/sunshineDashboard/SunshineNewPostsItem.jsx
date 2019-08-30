import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import PropTypes from 'prop-types';
import withErrorBoundary from '../common/withErrorBoundary'

class SunshineNewPostsItem extends Component {

  handleReview = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: { _id: post._id},
      data: {
        reviewedByUserId: currentUser._id,
        authorIsUnreviewed: false
      },
    })
  }

  handleFrontpage = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: { _id: post._id},
      data: {
        frontpageDate: new Date(),
        reviewedByUserId: currentUser._id,
        authorIsUnreviewed: false
      },
    })
  }

  handleDelete = () => {
    const { updatePost, post } = this.props
    if (confirm("Are you sure you want to move this post to the author's draft?")) {
      window.open(Users.getProfileUrl(post.user), '_blank');
      updatePost({
        selector: { _id: post._id},
        data: {
          draft: true,
        }
      })
    }
  }

  render () {
    const { post, hover, anchorEl } = this.props
    const { MetaInfo } = Components
    const { html: modGuidelinesHtml = "" } = post.moderationGuidelines || {}
    const { html: userGuidelinesHtml = "" } = post.user.moderationGuidelines || {}

    return (
      <Components.SunshineListItem hover={hover}>
        <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <Typography variant="h6">
            <Link to={Posts.getPageUrl(post)}>
              { post.title }
            </Link>
          </Typography>
          <br/>
          <div>
            <MetaInfo>
              { (post.moderationStyle || post.user.moderationStyle) && <span>Mod Style: </span> }
              { post.moderationStyle || post.user.moderationStyle }
              {!post.moderationStyle && post.user.moderationStyle && <span> (Default User Style)</span>}
            </MetaInfo>
          </div>
          <div>
            <MetaInfo>
              { (modGuidelinesHtml || userGuidelinesHtml) && <span>Mod Guidelines: </span> }
              <span dangerouslySetInnerHTML={{__html: modGuidelinesHtml || userGuidelinesHtml}}/>
              {!modGuidelinesHtml && userGuidelinesHtml && <span> (Default User Guideline)</span>}
            </MetaInfo>
          </div>
          <Components.PostsHighlight post={post}/>
        </Components.SidebarHoverOver>
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
                {post.user && post.user.displayName}
            </Link>
          </Components.SidebarInfo>
        </div>
        { hover && <Components.SidebarActionMenu>
          <Components.SidebarAction title="Leave on Personal Blog" onClick={this.handleReview}>
            done
          </Components.SidebarAction>
          {post.submitToFrontpage && <Components.SidebarAction title="Move to Frontpage" onClick={this.handleFrontpage}>
            thumb_up
          </Components.SidebarAction>}
          <Components.SidebarAction title="Move to Drafts" onClick={this.handleDelete} warningHighlight>
            clear
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
    )
  }
}

SunshineNewPostsItem.propTypes = {
  post: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
  updatePost: PropTypes.func.isRequired,
}

const withUpdateOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}

registerComponent('SunshineNewPostsItem', SunshineNewPostsItem, [withUpdate, withUpdateOptions], withUser, withHover, withErrorBoundary);
