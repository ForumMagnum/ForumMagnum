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

class SunshineCuratedSuggestionsItem extends Component {

  handleCurate = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser._id,
        curatedDate: new Date(),
      }
    })
  }

  handleDisregardForCurated = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: {_id: post._id},
      data: {
        reviewForCuratedUserId: currentUser._id,
      }
    })
  }

  handleSuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (!suggestUserIds.includes(currentUser._id)) {
      suggestUserIds.push(currentUser._id)
    }
    updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  handleUnsuggestCurated = () => {
    const { currentUser, post, updatePost } = this.props
    let suggestUserIds = _.clone(post.suggestForCuratedUserIds) || []
    if (suggestUserIds.includes(currentUser._id)) {
      suggestUserIds = _.without(suggestUserIds, currentUser._id);
    }
    updatePost({
      selector: {_id: post._id},
      data: {suggestForCuratedUserIds:suggestUserIds}
    })
  }

  render () {
    const { post, currentUser, hover, anchorEl } = this.props
    return (
      <Components.SunshineListItem hover={hover}>
        <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="h6">
            <Link to={Posts.getPageUrl(post)}>
              { post.title }
            </Link>
          </Typography>
          <br/>
          <Components.PostsHighlight post={post}/>
        </Components.SidebarHoverOver>
        <Link to={Posts.getPageUrl(post)}
          className="sunshine-sidebar-posts-title">
            {post.title}
        </Link>
        <div>
          <Components.SidebarInfo>
            { post.baseScore }
          </Components.SidebarInfo>
          <Components.SidebarInfo>
            <Link to={Users.getProfileUrl(post.user)}>
                {post.user && post.user.displayName}
            </Link>
          </Components.SidebarInfo>
          {post.postedAt && <Components.SidebarInfo>
            <Components.FormatDate date={post.postedAt}/>
          </Components.SidebarInfo>}
        </div>
        <Components.SidebarInfo>
          Endorsed by { post.suggestForCuratedUsernames }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { !post.suggestForCuratedUserIds || !post.suggestForCuratedUserIds.includes(currentUser._id) ?
            <Components.SidebarAction title="Endorse Curation" onClick={this.handleSuggestCurated}>
              plus_one
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Unendorse Curation" onClick={this.handleUnsuggestCurated}>
              undo
            </Components.SidebarAction>
          }
          <Components.SidebarAction title="Curate Post" onClick={this.handleCurate}>
            star
          </Components.SidebarAction>
          <Components.SidebarAction title="Remove from Curation Suggestions" onClick={this.handleDisregardForCurated}>
            clear
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
    )
  }
}

SunshineCuratedSuggestionsItem.propTypes = {
  currentUser: PropTypes.object.isRequired,
  updatePost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
}

const withUpdateOptions = {
  collection: Posts,
  fragmentName: 'PostsList',
}

registerComponent(
  'SunshineCuratedSuggestionsItem',
  SunshineCuratedSuggestionsItem,
  [withUpdate, withUpdateOptions],
  withUser,
  withHover,
  withErrorBoundary
);
