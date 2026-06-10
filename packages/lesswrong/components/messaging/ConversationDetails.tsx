import React from 'react';

import { useDialog } from '../common/withDialog';
import ConversationTitleEditForm from "./ConversationTitleEditForm";
import Loading from "../vulcan-core/Loading";
import MetaInfo from "../common/MetaInfo";
import UsersName from "../users/UsersName";
import { defineStyles } from '../hooks/defineStyles';
import { useStyles } from '../hooks/useStyles';
import { useCurrentUser } from '../common/withUser';
import { useMessages } from '../common/withMessages';
import { useMutation } from "@apollo/client/react";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ReportForm from "../sunshineDashboard/ReportForm";

const ConversationDetailsUserBlockQuery = gql(`
  query ConversationDetailsUserBlock($selector: UserBlockSelector) {
    userBlocks(selector: $selector, limit: 1) {
      results {
        ...UserBlockFragment
      }
    }
  }
`);

const CreateUserBlockMutation = gql(`
  mutation CreateUserBlockConversationDetails($data: CreateUserBlockDataInput!) {
    createUserBlock(data: $data) {
      data {
        ...UserBlockFragment
      }
    }
  }
`);

const UpdateUserBlockMutation = gql(`
  mutation UpdateUserBlockConversationDetails($selector: SelectorInput!, $data: UpdateUserBlockDataInput!) {
    updateUserBlock(selector: $selector, data: $data) {
      data {
        ...UserBlockFragment
      }
    }
  }
`);

const styles = defineStyles("ConversationDetails", (theme: ThemeType) => ({
  root: {
    marginTop: 16,
    marginBottom: 16,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  actions: {
    display: "inline-flex",
    gap: 8,
    flexShrink: 0,
  }
}))

// Component for displaying details about currently selected conversation
const ConversationDetails = ({conversation, hideOptions = false}: {
  conversation: ConversationsList,
  hideOptions?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { openDialog } = useDialog();

  const participants = conversation?.participants ?? [];
  const otherParticipant = participants.length === 2
    ? participants.find((participant) => participant._id !== currentUser?._id)
    : null;
  const showBlockUserOption = !!currentUser && !!otherParticipant && !conversation.moderator;
  const { data: userBlockData, refetch: refetchUserBlock } = useQuery(ConversationDetailsUserBlockQuery, {
    variables: {
      selector: {
        userAndBlockedUser: {
          userId: currentUser?._id,
          blockedUserId: otherParticipant?._id,
        },
      },
    },
    skip: !showBlockUserOption,
  });
  const userBlock = userBlockData?.userBlocks?.results?.[0] ?? null;
  const otherParticipantIsBlocked = userBlock?.blocked ?? false;
  const [createUserBlock] = useMutation(CreateUserBlockMutation);
  const [updateUserBlock] = useMutation(UpdateUserBlockMutation);

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
      if (!userBlock) return;
      await updateUserBlock({
        variables: {
          selector: { _id: userBlock._id },
          data: { blocked: false },
        },
      });
      flash({ messageString: `Unblocked ${otherParticipant.displayName}.` });
      void refetchUserBlock();
      return;
    }

    if (confirm(`Block ${otherParticipant.displayName} from sending you private messages?`)) {
      if (userBlock) {
        await updateUserBlock({
          variables: {
            selector: { _id: userBlock._id },
            data: { blocked: true },
          },
        });
      } else {
        await createUserBlock({
          variables: {
            data: {
              blockedUserId: otherParticipant._id,
              blocked: true,
            },
          },
        });
      }
      flash({ messageString: `${otherParticipant.displayName} can no longer send you private messages.` });
      void refetchUserBlock();
    }
  }

  const reportConversation = () => {
    if (!currentUser || !otherParticipant) return;

    openDialog({
      name: "ReportForm",
      contents: ({onClose}) => <ReportForm
        onClose={onClose}
        reportedUserId={otherParticipant._id}
        link={`/inbox?conversation=${conversation._id}`}
        title={`Report conversation with ${otherParticipant.displayName}`}
        placeholder="What are you reporting this conversation for?"
        onSubmit={() => {
          flash({ messageString: "Your report has been sent to the moderators." });
        }}
      />,
    });
  }

  if (!conversation?.participants?.length) return <Loading />

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
      <span className={classes.actions}>
        {showBlockUserOption && <span onClick={() => void updateBlockedUser()}>
          <MetaInfo button>
            {otherParticipantIsBlocked ? "Unblock" : "Block"}
          </MetaInfo>
        </span>}
        {showBlockUserOption && <span onClick={reportConversation}>
          <MetaInfo button>
            Report
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


