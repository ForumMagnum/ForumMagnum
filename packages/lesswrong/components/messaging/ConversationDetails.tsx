import React from 'react';

import { useDialog } from '../common/withDialog';
import ConversationTitleEditForm from "./ConversationTitleEditForm";
import Loading from "../vulcan-core/Loading";
import MetaInfo from "../common/MetaInfo";
import UsersName from "../users/UsersName";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { useUpdateCurrentUser } from '../hooks/useUpdateCurrentUser';
import { useMessages } from '../common/withMessages';

const styles = defineStyles("ConversationDetails", (theme: ThemeType) => ({
  root: {
    marginTop: 16,
    marginBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }
}))

// Component for displaying details about currently selected conversation
const ConversationDetails = ({conversation, hideOptions = false}: {
  conversation: ConversationsList,
  hideOptions?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const { flash } = useMessages();
  const { openDialog } = useDialog();
  if (!conversation?.participants?.length) return <Loading />

  const otherParticipant = conversation.participants.length === 2
    ? conversation.participants.find((participant) => participant._id !== currentUser?._id)
    : null;
  const blockedUserIds = currentUser?.blockedUserIds ?? [];
  const otherParticipantIsBlocked = !!otherParticipant && blockedUserIds.includes(otherParticipant._id);
  const showBlockUserOption = !!currentUser && !!otherParticipant && !conversation.moderator && !hideOptions;

  const openConversationOptions = () => {
    openDialog({
      name: "ConversationTitleEditForm",
      contents: ({onClose}) => <ConversationTitleEditForm
        onClose={onClose}
        conversation={conversation}
      />
    });
  }

  const updateBlockedUser = async () => {
    if (!currentUser || !otherParticipant) return;

    if (otherParticipantIsBlocked) {
      await updateCurrentUser({
        blockedUserIds: blockedUserIds.filter((userId) => userId !== otherParticipant._id),
      });
      flash({ messageString: `Unblocked ${otherParticipant.displayName}.` });
      return;
    }

    if (confirm(`Block ${otherParticipant.displayName} from sending you private messages?`)) {
      await updateCurrentUser({
        blockedUserIds: [...blockedUserIds, otherParticipant._id],
      });
      flash({ messageString: `${otherParticipant.displayName} can no longer send you private messages.` });
    }
  }

  return (
    <div className={classes.root}>
      <span>
        <MetaInfo>Participants:</MetaInfo>
        {conversation.participants.map((user, i) => <MetaInfo key={user._id}>
          <UsersName key={user._id} user={user}/>
          {/* inserts a comma for all but the last username */}
          { i < (conversation.participants?.length ?? 0) - 1 && ","}
        </MetaInfo>)}
      </span>
      <span>
        {showBlockUserOption && <span onClick={() => void updateBlockedUser()}>
          <MetaInfo button>
            {otherParticipantIsBlocked ? "Unblock User" : "Block User"}
          </MetaInfo>
        </span>}
        {!hideOptions && <span onClick={openConversationOptions}>
          <MetaInfo button>
            Conversation Options
          </MetaInfo>
        </span>}
      </span>
    </div>
  )
}

export default ConversationDetails;


