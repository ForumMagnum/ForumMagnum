import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTracking } from '../../lib/analyticsEvents';
import { TemplateQueryStrings } from '../messaging/NewConversationButton';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { Link } from '../../lib/reactRouterWrapper';
import isEqual from 'lodash/isEqual';
import classNames from 'classnames';
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
import { useInitiateConversation } from '../hooks/useInitiateConversation';
import { useAppendToEditor, AppendToEditorProvider } from '../editor/AppendToEditorContext';
import { getHighlightedTemplateNames } from './supermod/templateHighlightRules';
import FormatDate from '../common/FormatDate';
import GroupedModerationTemplateList from './GroupedModerationTemplateList';
import ModerationSectionTitle from './supermod/ModerationSectionTitle';
import RejectContentPanel from './supermod/RejectContentPanel';
import { canRejectContent, getContentTitle, type ContentItem } from './supermod/helpers';
import type { SidebarTab, SelectedSidebarTab } from './supermod/sidebarTabs';
import { focusLexicalEditorWhenReady } from '../editor/focusLexicalEditor';

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
  icon: {
    height: 13,
    width: 13,
    position: "relative",
    top: 2,
    marginRight: 3,
  },
  conversationItem: {
    marginBottom: 8,
  },
  conversationHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    cursor: "pointer",
    width: "100%",
  },
  expandIcon: {
    marginLeft: "auto",
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
    color: theme.palette.grey[600],
    cursor: "pointer",
    "&:hover": {
      opacity: 0.7,
    },
    marginBottom: -1,
    marginLeft: 4,
  },
  pastMessages: {
    marginBottom: 16,
    paddingBottom: 8,
    borderBottom: theme.palette.border.extraFaint,
  },
  conversationForm: {
    marginBottom: 16,
    paddingBottom: 8,
  },
  messagePrompt: {
    padding: 8,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.1),
    },
  },
  date: {
    color: theme.palette.grey[600],
    fontSize: 10,
  },
  conversationPreviewTooltip: {
    maxHeight: "100vh",
    overflow: "hidden",
  },
  tabs: {
    display: 'flex',
    alignItems: 'stretch',
    borderBottom: theme.palette.border.normal,
    marginBottom: 8,
  },
  tab: {
    ...theme.typography.commentStyle,
    minWidth: 0,
    padding: '6px 8px',
    fontSize: 13,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    borderBottom: '2px solid transparent',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  dmTab: {
    flexShrink: 0,
  },
  rejectTab: {
    flexShrink: 1,
  },
  activeTab: {
    color: theme.palette.grey[900],
    fontWeight: 600,
    borderBottomColor: theme.palette.primary.main,
  },
  disabledTab: {
    opacity: 0.4,
    cursor: 'default',
    '&:hover': {
      color: theme.palette.grey[600],
    },
  },
}));

interface SunshineUserMessagesProps {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts?: SunshinePostsList[];
  comments?: SunshineCommentsList[];
  focusedContent?: ContentItem | null;
  sidebarTab: SelectedSidebarTab;
  setSidebarTab: (tab: SidebarTab) => void;
}

const SunshineUserMessagesInner = ({user, currentUser, posts, comments, focusedContent, sidebarTab, setSidebarTab}: SunshineUserMessagesProps) => {
  const classes = useStyles(styles);

  const highlightedTemplateNames = useMemo(() => {
    if (!posts || !comments) return new Set<string>();
    return getHighlightedTemplateNames(
      {
        user,
        moderatorActions: user.moderatorActions ?? [],
      },
      posts,
      comments
    );
  }, [user, posts, comments]);

  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  const [expandedConversationId, setExpandedConversationId] = useState<string | undefined>();
  const dmEditorContainerRef = useRef<HTMLDivElement>(null);

  const { captureEvent } = useTracking()
  const { conversation, initiateConversation } = useInitiateConversation({ includeModerators: true });
  const { appendToEditor } = useAppendToEditor();

  // When a conversation is created/found, sync it to state
  useEffect(() => {
    if (conversation && !embeddedConversationId) {
      setEmbeddedConversationId(conversation._id);
    }
  }, [conversation, embeddedConversationId]);

  const toggleConversationPreview = (conversationId: string) => {
    setExpandedConversationId(prev => prev === conversationId ? undefined : conversationId);
  }

  const { data, refetch } = useQuery(ConversationsListMultiQuery, {
    variables: {
      selector: { moderatorConversations: { userId: user._id } },
      limit: 10,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.conversations?.results;

  const canReject = canRejectContent(focusedContent);
  const showRejectTab = !!focusedContent;
  const rejectTabActive = sidebarTab === 'reject' && canReject && !!focusedContent;
  const dmTabActive = sidebarTab === 'dm';

  // Opening the DM tab should land the moderator in a ready-to-type message, so it
  // starts the conversation rather than waiting for a second click on the prompt.
  const handleSelectDmTab = () => {
    setSidebarTab('dm');
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
    }
  };

  useEffect(() => {
    if (dmTabActive) {
      return focusLexicalEditorWhenReady(dmEditorContainerRef.current);
    }
  }, [dmTabActive, embeddedConversationId]);

  const handleMessageTemplateClick = (template: ModerationTemplateFragment) => {
    // Initiate conversation if we don't have one yet
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
      // For new conversations, use templateQueries to prefill
      // Downstream components rely on referential equality of the templateQueries object in a useEffect; we get an infinite loop here if we don't check for value equality
      const newTemplateQueries = {
        templateId: template._id,
        displayName: user.displayName,
      };
      if (!isEqual(newTemplateQueries, templateQueries)) {
        setTemplateQueries(newTemplateQueries);
      }
    } else if (template.contents?.html) {
      // Append to editor via context
      const processedHtml = getDraftMessageHtml({
        html: template.contents.html,
        displayName: user.displayName,
      });
      appendToEditor(processedHtml);
    }
  };

  const handleStartConversation = () => {
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
    }
  };

  const dmTabContents = <>
    {embeddedConversationId ? (
      <div className={classes.conversationForm} ref={dmEditorContainerRef}>
        <MessagesNewForm
          conversationId={embeddedConversationId}
          templateQueries={templateQueries}
          successEvent={async (newMessage) => {
            await refetch();
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
    <GroupedModerationTemplateList
      collectionName="Messages"
      onTemplateClick={handleMessageTemplateClick}
      highlightedTemplateNames={highlightedTemplateNames}
    />
  </>;

  return <div>
    {!!results?.length && <div className={classes.pastMessages}>
      <ModerationSectionTitle>User Messages</ModerationSectionTitle>
      {results.map(conversation => {
        const isExpanded = expandedConversationId === conversation._id;
        return (
          <LWTooltip key={conversation._id} placement="left-start" tooltip={false} titleClassName={classes.conversationPreviewTooltip} title={<div><ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth /></div>}>
            <div className={classes.conversationItem}>
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
                {conversation.latestActivity && <span className={classes.date}><FormatDate date={conversation.latestActivity} /></span>}
                <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
                  <ForumIcon icon="Link" className={classes.linkIcon} />
                </Link>
                <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />
              </div>
              {isExpanded && (
                <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />
              )}
            </div>
          </LWTooltip>
        );
      })}
    </div>}

    <div className={classes.tabs}>
      <div
        className={classNames(classes.tab, classes.dmTab, { [classes.activeTab]: dmTabActive })}
        onClick={handleSelectDmTab}
      >
        Send DM
      </div>
      {showRejectTab && <div
        className={classNames(classes.tab, classes.rejectTab, {
          [classes.activeTab]: rejectTabActive,
          [classes.disabledTab]: !canReject,
        })}
        onClick={() => canReject && setSidebarTab('reject')}
        title={canReject ? undefined : "This content can't be rejected"}
      >
        Reject {getContentTitle(focusedContent)}
      </div>}
    </div>

    {dmTabActive && dmTabContents}
    {rejectTabActive && focusedContent && (
      <RejectContentPanel user={user} focusedContent={focusedContent} />
    )}
  </div>;
}

export const SunshineUserMessages = (props: SunshineUserMessagesProps) => {
  return (
    <AppendToEditorProvider>
      <SunshineUserMessagesInner {...props} />
    </AppendToEditorProvider>
  );
};

export default SunshineUserMessages;
