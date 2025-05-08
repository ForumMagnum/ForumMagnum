import React from 'react';

import { registerComponent } from '../../lib/vulcan-lib/components';
import { useDialog } from '../common/withDialog';
import { preferredHeadingCase } from '../../themes/forumTheme';
import { ConversationTitleEditForm } from "./ConversationTitleEditForm";
import { Loading } from "../vulcan-core/Loading";
import { MetaInfo } from "../common/MetaInfo";
import { UsersName } from "../users/UsersName";

const styles = (theme: ThemeType) => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }
})

// Component for displaying details about currently selected conversation
const ConversationDetailsInner = ({conversation, hideOptions = false, classes}: {
  conversation: ConversationsList,
  hideOptions?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const { openDialog } = useDialog();
  if (!conversation?.participants?.length) return <Loading />

  const openConversationOptions = () => {
    openDialog({
      name: "ConversationTitleEditForm",
      contents: ({onClose}) => <ConversationTitleEditForm
        onClose={onClose}
        conversation={conversation}
      />
    });
  }

  return (
    <div className={classes.root}>
      <span>
        <MetaInfo>Participants:</MetaInfo>
        {conversation.participants.map((user, i) => <MetaInfo key={user._id}>
          <UsersName key={user._id} user={user}/>
          {/* inserts a comma for all but the last username */}
          { i < conversation.participants.length-1 && ","}
        </MetaInfo>)}
      </span>
      {!hideOptions && <span onClick={openConversationOptions}>
        <MetaInfo button>{preferredHeadingCase("Conversation Options")}</MetaInfo>
      </span>}
    </div>
  )
}

export const ConversationDetails = registerComponent('ConversationDetails', ConversationDetailsInner, {styles});

declare global {
  interface ComponentTypes {
    ConversationDetails: typeof ConversationDetails
  }
}
