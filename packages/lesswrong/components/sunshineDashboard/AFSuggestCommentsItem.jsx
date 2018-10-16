import { Components, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import { Posts } from '../../lib/collections/posts';
import { Comments } from '../../lib/collections/comments';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import PropTypes from 'prop-types';
import PlusOneIcon from '@material-ui/icons/PlusOne';
import UndoIcon from '@material-ui/icons/Undo';
import ClearIcon from '@material-ui/icons/Clear';

class AFSuggestCommentsItem extends Component {

  handleMoveToAlignment = () => {
    const { currentUser, post, updateComment } = this.props
    updateComment({
      documentId: post._id,
      set: {
        reviewForAlignmentUserId: currentUser._id,
        afDate: new Date(),
        af: true,
      },
      unset: {}
    })
  }

  handleDisregardForAlignment = () => {
    const { currentUser, post, updateComment } = this.props
    updateComment({
      documentId: post._id,
      set: {
        reviewForAlignmentUserId: currentUser._id,
      },
      unset: {}
    })
  }

  render () {
    const { comment, currentUser, hover, anchorEl, updateComment } = this.props

    const userHasVoted = comment.suggestForAlignmentUserIds && comment.suggestForAlignmentUserIds.includes(currentUser._id)

    return (
      <Components.SunshineListItem hover={hover}>
        <Components.SidebarHoverOver hover={hover} anchorEl={anchorEl} >
          <Typography variant="body2">
            <Link to={Posts.getPageUrl(comment.post) + "#" + comment._id}>
              Commented on post: <strong>{ comment.post.title }</strong>
            </Link>
            <Components.CommentBody comment={comment}/>
          </Typography>
        </Components.SidebarHoverOver>
        <Components.SunshineCommentsItemOverview comment={comment}/>
        <Components.SidebarInfo>
          Endorsed by { comment.suggestForAlignmentUsers && comment.suggestForAlignmentUsers.map(user=>user.displayName).join(", ") }
        </Components.SidebarInfo>
        { hover && <Components.SidebarActionMenu>
          { userHasVoted ?
            <Components.SidebarAction title="Unendorse for Alignment" onClick={()=>Comments.unSuggestForAlignment({currentUser, comment, updateComment})}>
              <UndoIcon/>
            </Components.SidebarAction>
            :
            <Components.SidebarAction title="Endorse for Alignment" onClick={()=>Comments.suggestForAlignment({currentUser, comment, updateComment})}>
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

AFSuggestCommentsItem.propTypes = {
  currentUser: PropTypes.object.isRequired,
  editMutation: PropTypes.func.isRequired,
  comment: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
}

const withUpdateOptions = {
  collection: Comments,
  fragmentName: 'SuggestAlignmentComment',
}

registerComponent(
  'AFSuggestCommentsItem',
  AFSuggestCommentsItem,
  [withUpdate, withUpdateOptions],
  withUser,
  withHover
);
