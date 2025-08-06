import React from 'react';
import { conversationGetPageUrl } from '../../lib/collections/conversations/helpers';
// import { useCurrentUser } from '../../components/common/withUser';
import * as _ from 'underscore';
import { siteNameWithArticleSetting } from '../../lib/instanceSettings';
import { EmailContextType } from "./emailContext";
import { EmailUsername } from './EmailUsername';
import { EmailFormatDate } from './EmailFormatDate';
import { EmailContentItemBody } from './EmailContentItemBody';

export const PrivateMessagesEmail = ({conversations, messages, participantsById, emailContext}: {
  conversations: Array<DbConversation>,
  messages: Array<DbMessage>,
  participantsById: Record<string,DbUser>,
  emailContext: EmailContextType,
}) => {
  if (conversations.length === 1) {
    return <React.Fragment>
      <p>
        You received {messages.length>1 ? "private messages" : "a private message"}.
      </p>
      <PrivateMessagesEmailConversation
        conversation={conversations[0]}
        messages={messages}
        participantsById={participantsById}
        emailContext={emailContext}
      />
    </React.Fragment>
  } else {
    return <React.Fragment>
      <p>
        You received {messages.length} private messages in {conversations.length} conversations.
      </p>
      {conversations.map(conv => <PrivateMessagesEmailConversation
        conversation={conv}
        key={conv._id}
        messages={_.filter(messages, message=>message.conversationId===conv._id)}
        participantsById={participantsById}
        emailContext={emailContext}
      />)}
    </React.Fragment>
  }
}

/// A list of users, nicely rendered with links, comma separators and an "and"
/// conjunction between the last two (if there are at least two).
export const EmailListOfUsers = ({users, emailContext}: {
  users: Array<DbUser>,
  emailContext: EmailContextType,
}) => {
  if (users.length === 0) {
    return <span>nobody</span>;
  } else if(users.length === 1) {
    return <EmailUsername user={users[0]}/>
  } else {
    let result: Array<string|React.JSX.Element> = [];
    for (let i=0; i<users.length; i++) {
      if (i===users.length-1) result.push(" and ");
      else if (i>0) result.push(", ");
      result.push(<EmailUsername user={users[i]}/>);
    }
    return <span>{result}</span>;
  }
}

export const PrivateMessagesEmailConversation = ({conversation, messages, participantsById, emailContext}: {
  conversation: ConversationsList|DbConversation,
  messages: Array<DbMessage>,
  participantsById: Partial<Record<string,DbUser>>,
  emailContext: EmailContextType,
}) => {
  const currentUser = emailContext.currentUser;
  const sitename = siteNameWithArticleSetting.get()
  const conversationLink = conversationGetPageUrl(conversation, true);

  const participantIds = conversation.participantIds ?? [];
  
  return (<React.Fragment>
    <p>Conversation with{" "}
      <EmailListOfUsers
        users={participantIds
          .filter((id: string)=>id!==currentUser!._id)
          .map((id: string)=>participantsById[id]!)
        }
        emailContext={emailContext}
      />
    </p>
    <p><a href={conversationLink}>View this conversation on {sitename}</a>.</p>
    
    {messages.map((message,i) => <div key={i}>
      <EmailUsername user={participantsById[message.userId]!}/>
      {" "}<EmailFormatDate date={message.createdAt}/>
      <EmailContentItemBody dangerouslySetInnerHTML={{
        __html: message.contents?.html ?? "",
      }}/>
    </div>)}
  </React.Fragment>);
}
