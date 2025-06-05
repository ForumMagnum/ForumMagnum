import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { Link } from '../../lib/reactRouterWrapper';
import isEqual from 'lodash/isEqual';
import SunshineSendMessageWithDefaults from "./SunshineSendMessageWithDefaults";
import MessagesNewForm from "../messaging/MessagesNewForm";
import UsersName from "../users/UsersName";
import LWTooltip from "../common/LWTooltip";
import MetaInfo from "../common/MetaInfo";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";

const ConversationsListMultiQuery = gql(`
  query multiConversationSunshineUserMessagesQuery($selector: ConversationSelector, $limit: Int, $enableTotal: Boolean) {
    conversations(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ConversationsList
      }
      totalCount
    }
  }
`);

const styles = (_theme: ThemeType) => ({
  row: {
    display: "flex",
    alignItems: "center"
  },
  icon: {
    height: 13,
    width: 13,
    position: "relative",
    top: 2,
    marginRight: 3,
  }
})

export const SunshineUserMessages = ({classes, user, currentUser}: {
  user: SunshineUsersList,
  classes: ClassesType<typeof styles>,
  currentUser: UsersCurrent,
}) => {
  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();

  const { captureEvent } = useTracking()

  const embedConversation = (conversationId: string, newTemplateQueries: TemplateQueryStrings) => {
    setEmbeddedConversationId(conversationId);
    // Downstream components rely on referential equality of the templateQueries object in a useEffect; we get an infinite loop here if we don't check for value equality
    if (!isEqual(newTemplateQueries, templateQueries)) {
      setTemplateQueries(newTemplateQueries);
    }
  }

  const { data } = useQuery(ConversationsListMultiQuery, {
    variables: {
      selector: { moderatorConversations: { userId: user._id } },
      limit: 10,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.conversations?.results;

  return <div>
    {results?.map(conversation => <div key={conversation._id}>
      <LWTooltip title={`${conversation.messageCount} messages in this conversation`}>
        <Link to={`/inbox/${conversation._id}`}>
          <MetaInfo><EmailIcon className={classes.icon}/> {conversation.messageCount}</MetaInfo>
          <span>
            Conversation with{" "} 
            {conversation.participants?.filter(participant => participant._id !== user._id).map(participant => {
              return <MetaInfo key={`${conversation._id}${participant._id}`}>
                <UsersName simple user={participant}/>
              </MetaInfo>
            })}
          </span>
        </Link>
      </LWTooltip>
    </div>)}
    <SunshineSendMessageWithDefaults 
        user={user} 
        embedConversation={embedConversation}
      />
    {embeddedConversationId && <div>
      <MessagesNewForm 
        conversationId={embeddedConversationId} 
        templateQueries={templateQueries}
        successEvent={() => {
          captureEvent('messageSent', {
            conversationId: embeddedConversationId,
            sender: currentUser._id,
            moderatorConveration: true
          })
        }}
      />
    </div>}
  </div>;
}

export default registerComponent('SunshineUserMessages', SunshineUserMessages, {styles});


