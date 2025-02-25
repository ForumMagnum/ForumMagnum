import { Components as C, registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import ClearIcon from '@material-ui/icons/Clear';
import DoneIcon from '@material-ui/icons/Done';
import withErrorBoundary from '../common/withErrorBoundary'
import * as _ from 'underscore';
import { useUpdate } from '../../lib/crud/withUpdate';

const AFSuggestUsersItem = ({user}: {
  user: SuggestAlignmentUser,
}) => {
  const currentUser = useCurrentUser();
  const [show, setShow] = useState(true);
  const { mutate: updateUser } = useUpdate({
    collectionName: "Users",
    fragmentName: 'SunshineUsersList',
  });
  
  // TODO This shouldn't be necessary, but for some weird reason this particular sidebar item doesn't update when you edit it and remove itself from the sidebar. (If you don't manually set the state it doesn't disappear until refresh )

  const handleReview = () => {
    void updateUser({
      selector: { _id: user._id },
      data: {
        reviewForAlignmentForumUserId: currentUser!._id,
        groups: _.unique([...(user.groups || []), 'alignmentForum'])
      }
    })
    setShow(false);
  }

  const handleIgnore = () => {
    void updateUser({
      selector: { _id: user._id },
      data: { reviewForAlignmentForumUserId: currentUser!._id }
    })
    setShow(false);
  }

  const { hover, anchorEl, eventHandlers } = useHover();

  if (show) {
    return (
        <span {...eventHandlers}>
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
              <C.SidebarAction title="Approve for AF" onClick={handleReview}>
                <DoneIcon />
              </C.SidebarAction>
              <C.SidebarAction warningHighlight={true} title="Ignore" onClick={handleIgnore}>
                <ClearIcon/>
              </C.SidebarAction>
            </C.SidebarActionMenu>}
          </C.SunshineListItem>
        </span>
    )
  } else {
    return null
  }
}

const AFSuggestUsersItemComponent = registerComponent('AFSuggestUsersItem', AFSuggestUsersItem, {
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    AFSuggestUsersItem: typeof AFSuggestUsersItemComponent
  }
}

