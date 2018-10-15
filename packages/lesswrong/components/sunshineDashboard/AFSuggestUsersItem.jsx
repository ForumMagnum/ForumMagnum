/* global confirm */
import { Components as C, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { Link } from 'react-router'
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import ClearIcon from '@material-ui/icons/Clear';

class AFSuggestUsersItem extends Component {

  handleReview = () => {
    const { currentUser, user, updateUser } = this.props
    updateUser({
      selector: { _id: user._id },
      data: {
        reviewForAlignmentForumUserId: currentUser._id,
        groups: _.unique([...user.groups || [], 'alignmentForum'])
      }
    })
  }

  handleIgnore = () => {
    const { currentUser, user, updateUser } = this.props
    updateUser({
      selector: { _id: user._id },
      data: { reviewForAlignmentForumUserId: currentUser._id }
    })
  }

  render () {
    const { user, hover, anchorEl } = this.props
    return (
        <C.SunshineListItem hover={hover}>
          <C.SidebarHoverOver hover={hover} anchorEl={anchorEl} width={250}>
            <Typography variant="body2">
              <Link to={Users.getProfileUrl(user)}>
                { user.displayName }
              </Link>
              <br/>
              <C.MetaInfo>
                <div>Alignment Posts: { user.afPostCount || 0 }</div>
                <div>Alignment Comments: { user.afCommentCount || 0 }</div>
              </C.MetaInfo>
            </Typography>
          </C.SidebarHoverOver>
          <div>
            <C.MetaInfo>
              <Link to={Users.getProfileUrl(user)}>
                  {user.displayName}
              </Link>
            </C.MetaInfo>
            <C.MetaInfo>
              { user.karma || 0 }
            </C.MetaInfo>
            <C.MetaInfo>
              Ω { user.afKarma || 0 }
            </C.MetaInfo>
            { user.reviewForAlignmentForumUserId}
          </div>

          { hover && <C.SidebarActionMenu>
            <C.SidebarAction title="Approve for AF" onClick={this.handleReview}>
              done
            </C.SidebarAction>
            <C.SidebarAction warningHighlight={true} title="Ignore" onClick={this.handleIgnore}>
              <ClearIcon/>
            </C.SidebarAction>
          </C.SidebarActionMenu>}
        </C.SunshineListItem>
    )
  }
}

AFSuggestUsersItem.propTypes = {
  user: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
  editMutation: PropTypes.func.isRequired,
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'SunshineUsersList',
}
registerComponent('AFSuggestUsersItem', AFSuggestUsersItem, [withUpdate, withUpdateOptions], withUser, withHover);
