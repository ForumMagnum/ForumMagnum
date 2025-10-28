import React, { useState } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { Link } from '../../lib/reactRouterWrapper';
import isEqual from 'lodash/isEqual';
import SunshineSendMessageWithDefaults from "./SunshineSendMessageWithDefaults";
import MessagesNewForm from "../messaging/MessagesNewForm";
import UsersName from "../users/UsersName";
import MetaInfo from "../common/MetaInfo";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ConversationPreview from '../messaging/ConversationPreview';
import ForumIcon from '../common/ForumIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import classNames from 'classnames';

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

const styles = defineStyles('SunshineUserMessages', (theme: ThemeType) => ({
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
  },
  conversationItem: {
    marginBottom: theme.spacing.unit,
  },
  conversationHeader: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  expandIcon: {
    height: 16,
    width: 16,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    }
  },
  expandablePreview: {
    maxHeight: 100,
    overflow: 'hidden',
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 30,
      background: `linear-gradient(to bottom, ${theme.palette.inverseGreyAlpha(0)}, ${theme.palette.background.pageActiveAreaBackground})`,
      pointerEvents: 'none',
    },
  },
}));

export const SunshineUserMessages = ({user, currentUser, showExpandablePreview}: {
  user: SunshineUsersList,
  currentUser: UsersCurrent,
  showExpandablePreview?: boolean,
}) => {
  const classes = useStyles(styles);
  
  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const [expandedConversationId, setExpandedConversationId] = useState<string | undefined>();

  const { captureEvent } = useTracking()

  const embedConversation = (conversationId: string, newTemplateQueries: TemplateQueryStrings) => {
    setEmbeddedConversationId(conversationId);
    // Downstream components rely on referential equality of the templateQueries object in a useEffect; we get an infinite loop here if we don't check for value equality
    if (!isEqual(newTemplateQueries, templateQueries)) {
      setTemplateQueries(newTemplateQueries);
    }
  }

  const toggleConversationPreview = (conversationId: string) => {
    setExpandedConversationId(prev => prev === conversationId ? undefined : conversationId);
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
    {results?.map(conversation => {
      const isExpanded = expandedConversationId === conversation._id;
      return (
        <div key={conversation._id} className={classes.conversationItem}>
          <div className={classes.conversationHeader} onClick={() => toggleConversationPreview(conversation._id)}>
            <Link to={`/inbox?conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
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
            <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />
          </div>
          {(isExpanded || showExpandablePreview) && (
            <div className={classNames((!isExpanded && showExpandablePreview) && classes.expandablePreview)}>
              <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />
            </div>
          )}
        </div>
      );
    })}
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

export default SunshineUserMessages;
