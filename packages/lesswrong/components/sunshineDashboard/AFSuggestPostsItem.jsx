import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import PropTypes from 'prop-types';
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'

class AFSuggestPostsItem extends Component {

  handleMoveToAlignment = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: {_id: post._id},
      data: {
        reviewForAlignmentUserId: currentUser._id,
        afDate: new Date(),
        af: true,
      }
    })
  }

  handleDisregardForAlignment = () => {
    const { currentUser, post, updatePost } = this.props
    updatePost({
      selector: {_id: post._id},
      data: {
        reviewForAlignmentUserId: currentUser._id,
      }
    })
  }

  render () {
    const { post, currentUser, hover, anchorEl, updatePost } = this.props

    const userHasVoted = post.suggestForAlignmentUserIds && post.suggestForAlignmentUserIds.includes(currentUser._id)

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
          Endorsed by { post.suggestForAlignmentUsers && post.suggestForAlignmentUsers.map(user=>user.displayName).join(", ") }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { userHasVoted ?
            <Components.SidebarAction title="Unendorse for Alignment" onClick={()=>Posts.unSuggestForAlignment({currentUser, post, updatePost})}>
              <UndoIcon/>
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Endorse for Alignment" onClick={()=>Posts.suggestForAlignment({currentUser, post, updatePost})}>
              <PlusOneIcon/>
            </Components.SidebarAction>
          }
          <Components.SidebarAction title="Move to Alignment" onClick={this.handleMoveToAlignment}>
            <Components.OmegaIcon/>
          </Components.SidebarAction>
          <Components.SidebarAction title="Remove from Alignment Suggestions" onClick={this.handleDisregardForAlignment}>
            <ClearIcon/>
          </Components.SidebarAction>
        </Components.SidebarActionMenu>}
      </Components.SunshineListItem>
    )
  }
}

AFSuggestPostsItem.propTypes = {
  currentUser: PropTypes.object.isRequired,
  updatePost: PropTypes.func.isRequired,
  post: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
}

const withUpdateOptions = {
  collection: Posts,
  fragmentName: 'SuggestAlignmentPost',
}

registerComponent(
  'AFSuggestPostsItem',
  AFSuggestPostsItem,
  [withUpdate, withUpdateOptions],
  withUser,
  withHover,
  withErrorBoundary
);
