import { Components as C, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { Component } from 'react';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import withUser from '../common/withUser';
import withHover from '../common/withHover'
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import withErrorBoundary from '../common/withErrorBoundary'
import * as _ from 'underscore';

interface ExternalProps {
  user: SuggestAlignmentUser,
}
interface AFSuggestUsersItemProps extends ExternalProps, WithUserProps, WithHoverProps, WithUpdateUserProps {
}
interface AFSuggestUsersItemState {
  show: boolean,
}

class AFSuggestUsersItem extends Component<AFSuggestUsersItemProps,AFSuggestUsersItemState> {
  // TODO This shouldn't be necessary, but for some weird reason this particular sidebar item doesn't update when you edit it and remove itself from the sidebar. (If you don't manually set the state it doesn't disappear until refresh )

  state: AFSuggestUsersItemState = {show:true}

  handleReview = () => {
    const { currentUser, user, updateUser } = this.props
    void updateUser({
      selector: { _id: user._id },
      data: {
        reviewForAlignmentForumUserId: currentUser!._id,
        groups: _.unique([...(user.groups || []), 'alignmentForum'])
      }
    })
    this.setState({show:false})
  }

  handleIgnore = () => {
    const { currentUser, user, updateUser } = this.props
    void updateUser({
      selector: { _id: user._id },
      data: { reviewForAlignmentForumUserId: currentUser!._id }
    })
    this.setState({show:false})
  }

  render () {
    const { user, hover, anchorEl } = this.props
    if (this.state.show) {
      return (
          <C.SunshineListItem hover={hover}>
            <C.SidebarHoverOver hover={hover} anchorEl={anchorEl} width={250}>
              <C.Typography variant="body2">
                <Link to={userGetProfileUrl(user)}>
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
              </C.Typography>
            </C.SidebarHoverOver>
            <div>
              <C.MetaInfo>
                <Link to={userGetProfileUrl(user)}>
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
                <DoneIcon />
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

const AFSuggestUsersItemComponent = registerComponent<ExternalProps>('AFSuggestUsersItem', AFSuggestUsersItem, {
  hocs: [
    withUpdate({
      collectionName: "Users",
      fragmentName: 'SunshineUsersList',
    }),
    withUser, withHover(), withErrorBoundary
  ]
});

declare global {
  interface ComponentTypes {
    AFSuggestUsersItem: typeof AFSuggestUsersItemComponent
  }
}

