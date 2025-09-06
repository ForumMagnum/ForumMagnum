import { registerComponent } from '../../lib/vulcan-lib/components';
import React, { useState } from 'react';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import ClearIcon from '@/lib/vendor/@material-ui/icons/src/Clear';
import DoneIcon from '@/lib/vendor/@material-ui/icons/src/Done';
import withErrorBoundary from '../common/withErrorBoundary'
import SunshineListItem from "./SunshineListItem";
import SidebarHoverOver from "./SidebarHoverOver";
import { Typography } from "../common/Typography";
import MetaInfo from "../common/MetaInfo";
import SidebarActionMenu from "./SidebarActionMenu";
import SidebarAction from "./SidebarAction";
import { useMutation } from "@apollo/client/react";
import { gql } from "@/lib/generated/gql-codegen";

const SunshineUsersListUpdateMutation = gql(`
  mutation updateUserAFSuggestUsersItem($selector: SelectorInput!, $data: UpdateUserDataInput!) {
    updateUser(selector: $selector, data: $data) {
      data {
        ...SunshineUsersList
      }
    }
  }
`);

const AFSuggestUsersItem = ({user}: {
  user: SuggestAlignmentUser,
}) => {
  const currentUser = useCurrentUser();
  const [show, setShow] = useState(true);
  const [updateUser] = useMutation(SunshineUsersListUpdateMutation);
  
  // TODO This shouldn't be necessary, but for some weird reason this particular sidebar item doesn't update when you edit it and remove itself from the sidebar. (If you don't manually set the state it doesn't disappear until refresh )

  const handleReview = () => {
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: {
          reviewForAlignmentForumUserId: currentUser!._id,
          groups: [...new Set([...(user.groups || []), 'alignmentForum'])]
        }
      }
    })
    setShow(false);
  }

  const handleIgnore = () => {
    void updateUser({
      variables: {
        selector: { _id: user._id },
        data: { reviewForAlignmentForumUserId: currentUser!._id }
      }
    })
    setShow(false);
  }

  const { hover, anchorEl, eventHandlers } = useHover();

  if (show) {
    return (
        <span {...eventHandlers}>
          <SunshineListItem hover={hover}>
            <SidebarHoverOver hover={hover} anchorEl={anchorEl} width={250}>
              <Typography variant="body2">
                <Link to={userGetProfileUrl(user)}>
                  { user.displayName }
                </Link>
                <br/>
                <MetaInfo>
                  <div>Alignment Posts: { user.afPostCount || 0 }</div>
                  <div>Alignment Comments: { user.afCommentCount || 0 }</div>
                </MetaInfo>
                {user.afApplicationText && <p>
                  Application:
                  {user.afApplicationText}
                </p>}
              </Typography>
            </SidebarHoverOver>
            <div>
              <MetaInfo>
                <Link to={userGetProfileUrl(user)}>
                    {user.displayName}
                </Link>
              </MetaInfo>
              <MetaInfo>
                { user.karma || 0 }
              </MetaInfo>
              <MetaInfo>
                Ω { user.afKarma || 0 }
              </MetaInfo>
              { user.reviewForAlignmentForumUserId }
            </div>
            { hover && <SidebarActionMenu>
              <SidebarAction title="Approve for AF" onClick={handleReview}>
                <DoneIcon />
              </SidebarAction>
              <SidebarAction warningHighlight={true} title="Ignore" onClick={handleIgnore}>
                <ClearIcon/>
              </SidebarAction>
            </SidebarActionMenu>}
          </SunshineListItem>
        </span>
    )
  } else {
    return null
  }
}

export default registerComponent('AFSuggestUsersItem', AFSuggestUsersItem, {
  hocs: [withErrorBoundary]
});



