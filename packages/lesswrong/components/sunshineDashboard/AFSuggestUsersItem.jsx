import { Components as C, registerComponent, withUpdate } from 'meteor/vulcan:core';
import React, { Component } from 'react';
import Users from 'meteor/vulcan:users';
import { Link } from '../../lib/reactRouterWrapper.js'
import PropTypes from 'prop-types';
import Typography from '@material-ui/core/Typography';
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import ClearIcon from '@material-ui/icons/Clear';
import withErrorBoundary from '../common/withErrorBoundary'

class AFSuggestUsersItem extends Component {
  // TODO This shouldn't be necessary, but for some weird reason this particular sidebar item doesn't update when you edit it and remove itself from the sidebar. (If you don't manually set the state it doesn't disappear until refresh )

  state = {show:true}

  handleReview = () => {
    const { currentUser, user, updateUser } = this.props
    updateUser({
      selector: { _id: user._id },
      data: {
        reviewForAlignmentForumUserId: currentUser._id,
        groups: _.unique([...(user.groups || []), 'alignmentForum'])
      }
    })
    this.setState({show:false})
  }

  handleIgnore = () => {
    const { currentUser, user, updateUser } = this.props
    updateUser({
      selector: { _id: user._id },
      data: { reviewForAlignmentForumUserId: currentUser._id }
    })
    this.setState({show:false})
  }

  render () {
    const { user, hover, anchorEl } = this.props
    if (this.state.show) {
      return (
          <C.SunshineListItem hover={hover}>
            <C.SidebarHoverOver hover={hover} anchorEl={anchorEl} width={250}>
              <Typography variant="body1">
                <Link to={Users.getProfileUrl(user)}>
                  { user.displayName }
                </Link>
                <br/>
                <C.MetaInfo>
                  <div>Alignment Posts: { user.afPostCount || 0 }</div>
                  <div>Alignment Comments: { user.afCommentCount || 0 }</div>
                </C.MetaInfo>
                {user.afApplicationText && <p>
                  Application:
                  {user.afApplicationText}
                </p>}
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
              { user.reviewForAlignmentForumUserId }
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
    } else {
      return null
    }
  }
}

AFSuggestUsersItem.propTypes = {
  user: PropTypes.object.isRequired,
  hover: PropTypes.bool.isRequired,
  anchorEl: PropTypes.object,
  currentUser: PropTypes.object.isRequired,
  updateUser: PropTypes.func.isRequired,
}

const withUpdateOptions = {
  collection: Users,
  fragmentName: 'SunshineUsersList',
}
registerComponent('AFSuggestUsersItem', AFSuggestUsersItem, [withUpdate, withUpdateOptions], withUser, withHover, withErrorBoundary);
