import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { Link } from '../../lib/reactRouterWrapper';
import isEqual from 'lodash/isEqual';
import MessagesNewForm from "../messaging/MessagesNewForm";
import { getDraftMessageHtml } from '../../lib/collections/messages/helpers';
import UsersName from "../users/UsersName";
import MetaInfo from "../common/MetaInfo";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import ConversationPreview from '../messaging/ConversationPreview';
import ForumIcon from '../common/ForumIcon';
import { defineStyles, useStyles } from '../hooks/useStyles';
import LWTooltip from '../common/LWTooltip';
import { ModerationTemplateSunshineItem } from './ModerationTemplateSunshineItem';
import { useInitiateConversation } from '../hooks/useInitiateConversation';

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

export const ModerationTemplatesListQuery = gql(`
  query multiModerationTemplateSunshineUserMessagesQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
    moderationTemplates(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ModerationTemplateFragment
      }
      totalCount
    }
  }
`);

const styles = defineStyles('SunshineUserMessages', (theme: ThemeType) => ({
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
  linkIcon: {
    height: 12,
    width: 12,
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
    marginBottom: -1,
    marginLeft: 4,
  },
  conversationForm: {
    marginTop: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 2,
    paddingBottom: theme.spacing.unit,
    borderBottom: theme.palette.border.extraFaint,
  },
  templateList: {
    marginTop: theme.spacing.unit * 4,
    opacity: 0.5,
    display: 'flex',
    flexDirection: 'column',
    "&:hover": {
      opacity: 1,
    },
  },
  templateGroup: {
    marginBottom: theme.spacing.unit * 2,
    display: 'flex',
    flexDirection: 'column',
    '& h3': {
      marginBottom: theme.spacing.unit,
    },
  },
  messagePrompt: {
    padding: theme.spacing.unit,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
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
  const appendToEditorRef = useRef<((html: string) => void) | null>(null);

  const { captureEvent } = useTracking()
  const { conversation, initiateConversation } = useInitiateConversation({ includeModerators: true });

  const handleAppendToEditorReady = useCallback((appendFn: (html: string) => void) => {
    appendToEditorRef.current = appendFn;
  }, []);

  // When a conversation is created/found, sync it to state
  useEffect(() => {
    if (conversation && !embeddedConversationId) {
      setEmbeddedConversationId(conversation._id);
    }
  }, [conversation, embeddedConversationId]);

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

  const { data: templatesData } = useQuery(ModerationTemplatesListQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: "Messages" } },
      limit: 50,
      enableTotal: false,
    },
  });

  const results = data?.conversations?.results;
  const templates = templatesData?.moderationTemplates?.results;

  const handleTemplateClick = (template: NonNullable<typeof templates>[0]) => {
    // Initiate conversation if we don't have one yet
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
      // For new conversations, use templateQueries to prefill
      setTemplateQueries({
        templateId: template._id,
        displayName: user.displayName,
      });
    } else if (appendToEditorRef.current && template.contents?.html) {
      // If editor is ready, append directly
      const processedHtml = getDraftMessageHtml({
        html: template.contents.html,
        displayName: user.displayName,
      });
      appendToEditorRef.current(processedHtml);
    } else {
      // Fallback to template queries (will replace content)
      setTemplateQueries({
        templateId: template._id,
        displayName: user.displayName,
      });
    }
  };

  const handleStartConversation = () => {
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
    }
  };

  const allTemplatesGrouped: Record<string, NonNullable<typeof templates>[0][]> = templates ? (() => {
    const grouped: Record<string, NonNullable<typeof templates>[0][]> = {};
    const templatesWithoutGroup: NonNullable<typeof templates>[0][] = [];
    
    templates.forEach(template => {
      const groupLabel = template.groupLabel;
      if (groupLabel) {
        if (!grouped[groupLabel]) {
          grouped[groupLabel] = [];
        }
        grouped[groupLabel].push(template);
      } else {
        templatesWithoutGroup.push(template);
      }
    });
    
    if (templatesWithoutGroup.length > 0) {
      grouped["Other"] = templatesWithoutGroup;
    }
    
    return grouped;
  })() : {};

  return <div>
    {results?.map(conversation => {
      const isExpanded = expandedConversationId === conversation._id;
      return (
        <div key={conversation._id} className={classes.conversationItem}>
          <LWTooltip tooltip={false} placement="left" title={ <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />}>
            <div className={classes.conversationHeader} onClick={() => toggleConversationPreview(conversation._id)}>
              <MetaInfo><EmailIcon className={classes.icon}/> {conversation.messageCount}</MetaInfo>
              <span>
                Conversation with{" "} 
                {conversation.participants?.filter(participant => participant._id !== user._id).map(participant => {
                  return <MetaInfo key={`${conversation._id}${participant._id}`}>
                    <UsersName simple user={participant}/>
                  </MetaInfo>
                })}
              </span>
              <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />
              <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
                <ForumIcon icon="Link" className={classes.linkIcon} />
              </Link> 
            </div>
          </LWTooltip>
        </div>
      );
    })}
    {embeddedConversationId ? (
      <div className={classes.conversationForm}>
        <MessagesNewForm 
          conversationId={embeddedConversationId} 
          templateQueries={templateQueries}
          onAppendToEditorReady={handleAppendToEditorReady}
          successEvent={(newMessage) => {
            captureEvent('messageSent', {
              conversationId: newMessage.conversationId,
              sender: currentUser._id,
              moderatorConveration: true
            })
          }}
        />
      </div>
    ) : (
      <div className={classes.messagePrompt} onClick={handleStartConversation}>
        Click to start a new message...
      </div>
    )}
    {templates && templates.length > 0 && (
      <div className={classes.templateList}>
        {Object.entries(allTemplatesGrouped).map(([group, templatesInGroup]) => (
          <div key={group} className={classes.templateGroup}>
            <h3>{group}</h3>
            {templatesInGroup.map(template => (
              <ModerationTemplateSunshineItem key={template._id} template={template} onTemplateClick={handleTemplateClick} />
            ))}
          </div>
        ))}
      </div>
    )}
    
  </div>;
}

export default SunshineUserMessages;
