import React from 'react';

import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useDialog } from '../common/withDialog';
import { preferredHeadingCase } from '../../themes/forumTheme';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }
})

// Component for displaying details about currently selected conversation
const ConversationDetails = ({conversation, hideOptions = false, classes}: {
  conversation: ConversationsList,
  hideOptions?: boolean,
  classes: ClassesType,
}) => {
  const { openDialog } = useDialog();
  const { Loading, MetaInfo, UsersName } = Components
  if (!conversation?.participants?.length) return <Loading />

  const openConversationOptions = () => {
    openDialog({
      componentName: "ConversationTitleEditForm",
      componentProps: {
        documentId: conversation._id
      }
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

const ConversationDetailsComponent = registerComponent('ConversationDetails', ConversationDetails, {styles});

declare global {
  interface ComponentTypes {
    ConversationDetails: typeof ConversationDetailsComponent
  }
}
