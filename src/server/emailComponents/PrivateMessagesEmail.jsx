import React from 'react';
import { getSetting, registerComponent, Components } from 'meteor/vulcan:core';
import { withStyles } from '@material-ui/core/styles';
import { Conversations } from '../../lib/collections/conversations/collection.js';
import './EmailUsername.jsx';
import './EmailFormatDate.jsx';

const styles = theme => ({
  message: {
  },
});

const PrivateMessagesEmail = ({conversation, messages, participantsById, classes}) => {
  const { EmailUsername, EmailFormatDate } = Components;
  const sitename = getSetting('title');
  const conversationLink = Conversations.getPageUrl(conversation, true);
  
  return (<React.Fragment>
    <p>
      You received {messages.length>1 ? "private messages" : "a private message"}.
      {" "}<a href={conversationLink}>View this conversation on {sitename}</a>.
    </p>
    
    {messages.map((message,i) => <div className={classes.message} key={i}>
      <EmailUsername user={participantsById[message.userId]}/>
      {" "}<EmailFormatDate date={message.createdAt}/>
      <div dangerouslySetInnerHTML={{__html: message.contents.html}}/>
    </div>)}
  </React.Fragment>);
}

registerComponent("PrivateMessagesEmail", PrivateMessagesEmail,
  withStyles(styles, {name: "PrivateMessagesEmail"}));
