/*

Component for displaying details about currently selected conversation

*/

import React from 'react';
import { Components, registerComponent } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import withUser from '../common/withUser';
import withDialog from '../common/withDialog';

const styles = theme => ({
  root: {
    marginTop: theme.spacing.unit*2,
    marginBottom: theme.spacing.unit*2,
    display: "flex",
    justifyContent: "space-between",
    flexWrap: "wrap",
  }
})

const ConversationDetails = ({conversation, classes, openDialog}) => {
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
      <span onClick={openConversationOptions}>
        <MetaInfo button>Conversation Options</MetaInfo>
      </span>
    </div>
  )
}

registerComponent('ConversationDetails', ConversationDetails, withUser, withStyles(styles, { name: "ConversationDetails" }), withDialog);
