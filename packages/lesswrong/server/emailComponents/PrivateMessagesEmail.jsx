import React from 'react';
import { registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import './EmailUsername.jsx';

const styles = theme => ({
  message: {
  },
});

const PrivateMessagesEmail = ({conversation, messages, participantsById, classes}) => {
  const { EmailUsername } = Components;
  return (<React.Fragment>
    {messages.map((message,i) => <div className={classes.message} key={i}>
      <EmailUsername user={participantsById[message.userId]}/>
      <div dangerouslySetInnerHTML={{__html: message.contents.html}}/>
    </div>)}
  </React.Fragment>);
}

registerComponent("PrivateMessagesEmail", PrivateMessagesEmail,
  withStyles(styles, {name: "PrivateMessagesEmail"}));
