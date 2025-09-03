import React from 'react';
import DropdownMenu from "../DropdownMenu";
import DropdownItem from "../DropdownItem";
import { useCurrentUser } from '../../common/withUser';
import NewConversationButton from '../../messaging/NewConversationButton';
import { useDialog } from '../../common/withDialog';
import NewDialogueDialog from '../../posts/NewDialogueDialog';
import { userCanPost } from '../../../lib/collections/users/helpers';
import { MINIMUM_COAUTHOR_KARMA } from '../../../lib/collections/posts/helpers';
import { userOverNKarmaOrApproved } from '../../../lib/vulcan-users/permissions';
import { dialoguesEnabled } from '../../../lib/betas';
import NotifyMeToggleDropdownItem from "../NotifyMeToggleDropdownItem";
import { defineStyles, useStyles } from '../../hooks/useStyles';

const styles = defineStyles("UserActions", (_theme: ThemeType) => ({
  root: {
    minWidth: 220,
    maxWidth: "calc(100vw - 100px)",
  },
}));

const UserActions = ({user, closeMenu, from = "userActions"}: {
  user: UsersMinimumInfo,
  closeMenu: () => void,
  from?: string,
}) => {
  const currentUser = useCurrentUser();
  const classes = useStyles(styles);
  const { openDialog } = useDialog();
  
  const isCurrentUser = currentUser?._id === user._id;
  
  const canCreateDialogue = currentUser && userCanPost(currentUser) 
    && dialoguesEnabled()
    && userOverNKarmaOrApproved(MINIMUM_COAUTHOR_KARMA)(currentUser);

  const handleDialogueClick = () => {
    closeMenu();
    openDialog({ 
      name: "NewDialogueDialog", 
      contents: ({onClose}) => (
        <NewDialogueDialog
          onClose={onClose}
          initialParticipantIds={[user._id]}
        />
      )
    });
  };

  if (!currentUser || isCurrentUser) {
    return null;
  }

  return (
    <DropdownMenu className={classes.root}>
      
      <NotifyMeToggleDropdownItem
        document={user}
        title="Notify on posts"
        subscriptionType="newPosts"
      />
      
      <NotifyMeToggleDropdownItem
        document={user}
        title="Notify on comments"
        subscriptionType="newUserComments"
      />

      <NewConversationButton
        user={user}
        currentUser={currentUser}
        from={from}
      >
        <DropdownItem
          title="Message"
        />
      </NewConversationButton>
      
      {canCreateDialogue && (
        <DropdownItem
          title="Dialogue"
          onClick={handleDialogueClick}
        />
      )}
      
    </DropdownMenu>
  );
};

export default UserActions;

