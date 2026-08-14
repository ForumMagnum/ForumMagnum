import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
import KeystrokeDisplay from './supermod/KeystrokeDisplay';
import ComposerKeydownWrapper from './supermod/ComposerKeydownWrapper';
import { canRejectContent, getContentTitle, type ContentItem } from './supermod/helpers';
import type { SelectedSidebarTab } from './supermod/sidebarTabs';
import { focusLexicalEditorAtEnd, focusLexicalEditorWhenReady } from '../editor/focusLexicalEditor';

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

// Same selector as the rejection panel's template list, so the highlighted-template
// shortcuts shown while the panel is closed resolve from the same cached data
const RejectionTemplatesQuery = gql(`
  query rejectionTemplatesSunshineUserMessagesQuery($selector: ModerationTemplateSelector, $limit: Int, $enableTotal: Boolean) {
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
    // One line tall until the moderator types or inserts a template (the
    // lexical min-height var is already 1em via MessagesNewForm's own styles,
    // but the editor wrapper adds a 100px min-height that we undo here)
    '& .EditorFormComponent-commentEditorHeight': {
      minHeight: 'unset',
    },
    '& .EditorFormComponent-commentEditorHeight .ck.ck-content': {
      minHeight: 'unset',
    },
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
    marginBottom: 8,
  },
  tab: {
    ...theme.typography.commentStyle,
    minWidth: 0,
    padding: '6px 8px',
    fontSize: 13,
    color: theme.palette.grey[600],
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  // Underlines the label only, not the tab's full-width click target
  tabLabel: {
    borderBottom: '2px solid transparent',
    paddingBottom: 2,
  },
  // KeystrokeDisplay's root is display:flex, so the label needs to be a flex
  // container for the badge to sit inline with the text
  rejectTabLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    maxWidth: '100%',
  },
  rejectTabTitle: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  dmTab: {
    flexShrink: 0,
    // Pushed to the right edge so the tabs read as separate choices
    marginLeft: 'auto',
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
  // Deselected composers stay mounted (so drafts survive), just hidden
  hiddenTabContent: {
    display: 'none',
  },
  // Highlighted rejection templates stay visible as shortcuts while the
  // reject section itself is closed
  collapsedHighlightedTemplates: {
    ...theme.typography.commentStyle,
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    marginBottom: 8,
  },
  collapsedHighlightedTemplate: {
    fontSize: 13,
    fontWeight: 600,
    padding: '4px 8px',
    borderRadius: 4,
    outline: theme.palette.greyBorder("1px", 0.8),
    outlineOffset: -1,
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: theme.palette.greyAlpha(0.05),
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
  setSidebarTab: (tab: SelectedSidebarTab) => void;
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
  const [templateSearchToken, setTemplateSearchToken] = useState(0);
  const [pendingComposerFocus, setPendingComposerFocus] = useState(false);
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

  const { data: rejectionTemplatesData } = useQuery(RejectionTemplatesQuery, {
    variables: {
      selector: { moderationTemplatesList: { collectionName: "Rejections" } },
      limit: 50,
      enableTotal: false,
    },
    skip: !showRejectTab,
  });
  const highlightedRejectionTemplates = (rejectionTemplatesData?.moderationTemplates?.results ?? [])
    .filter(template => highlightedTemplateNames.has(template.name));

  // The reject panel registers its composer's template toggle here, so the
  // highlighted-template shortcuts can insert a template while the panel's tab
  // is closed (the panel stays mounted, just hidden)
  const rejectToggleTemplateRef = useRef<(template: ModerationTemplateFragment) => void>(() => {});
  const registerRejectToggleTemplate = useCallback((fn: (template: ModerationTemplateFragment) => void) => {
    rejectToggleTemplateRef.current = fn;
  }, []);

  const handleCollapsedRejectTemplateClick = (template: ModerationTemplateFragment) => {
    setSidebarTab('reject');
    rejectToggleTemplateRef.current(template);
  };

  // Start the conversation on tab click, not on a second click on the prompt.
  // Clicking the already-active tab closes the composer.
  const handleSelectDmTab = () => {
    if (dmTabActive) {
      setSidebarTab(null);
      return;
    }
    setSidebarTab('dm');
    handleStartConversation();
  };

  // The template search is the initial keyboard target whenever the tab is picked
  useEffect(() => {
    if (dmTabActive) {
      setTemplateSearchToken(token => token + 1);
    }
  }, [dmTabActive]);

  // Composer focus has to wait until the conversation (and thus the editor) exists
  useEffect(() => {
    if (pendingComposerFocus && dmTabActive && embeddedConversationId) {
      setPendingComposerFocus(false);
      return focusLexicalEditorWhenReady(dmEditorContainerRef.current);
    }
  }, [pendingComposerFocus, dmTabActive, embeddedConversationId]);

  const handleMessageTemplateClick = (template: ModerationTemplateFragment) => {
    if (!embeddedConversationId) {
      setPendingComposerFocus(true);
      initiateConversation([user._id]);
      const newTemplateQueries = {
        templateId: template._id,
        displayName: user.displayName,
      };
      // A downstream useEffect keys on this object's identity; a fresh but
      // equal object loops forever
      if (!isEqual(newTemplateQueries, templateQueries)) {
        setTemplateQueries(newTemplateQueries);
      }
    } else if (template.contents?.html) {
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

  // Focusing from the template list's Tab shortcut; if there's no conversation yet the
  // composer doesn't exist, so start one — the effect above focuses it once it renders.
  const handleFocusComposer = () => {
    if (embeddedConversationId) {
      focusLexicalEditorAtEnd(dmEditorContainerRef.current);
    } else {
      setPendingComposerFocus(true);
      handleStartConversation();
    }
  };

  // Clicking the prompt is an explicit request to type a message, so the
  // composer (not the search) gets focus once the conversation exists
  const handleMessagePromptClick = () => {
    setPendingComposerFocus(true);
    handleStartConversation();
  };

  // Escape while focused inside a section closes it, like clicking its tab again
  const handleCloseSidebarTab = () => {
    setSidebarTab(null);
  };

  const dmTabContents = <>
    {embeddedConversationId ? (
      <ComposerKeydownWrapper
        className={classes.conversationForm}
        containerRef={dmEditorContainerRef}
        onArrowDownPastEnd={() => setTemplateSearchToken(token => token + 1)}
        onEscape={handleCloseSidebarTab}
      >
        <MessagesNewForm
          conversationId={embeddedConversationId}
          templateQueries={templateQueries}
          keystrokeSubmitButton
          successEvent={async (newMessage) => {
            await refetch();
            captureEvent('messageSent', {
              conversationId: newMessage.conversationId,
              sender: currentUser._id,
              moderatorConveration: true
            })
          }}
        />
      </ComposerKeydownWrapper>
    ) : (
      <div className={classes.messagePrompt} onClick={handleMessagePromptClick}>
        Click to start a new message...
      </div>
    )}
    <GroupedModerationTemplateList
      collectionName="Messages"
      onTemplateClick={handleMessageTemplateClick}
      highlightedTemplateNames={highlightedTemplateNames}
      onFocusComposer={handleFocusComposer}
      focusSearchToken={templateSearchToken}
      active={dmTabActive}
      onEscape={handleCloseSidebarTab}
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
      {showRejectTab && <div
        className={classNames(classes.tab, classes.rejectTab, { [classes.disabledTab]: !canReject })}
        onClick={() => canReject && setSidebarTab(rejectTabActive ? null : 'reject')}
        title={canReject ? undefined : "This content can't be rejected"}
      >
        <span className={classNames(classes.tabLabel, classes.rejectTabLabel, { [classes.activeTab]: rejectTabActive })}>
          <span className={classes.rejectTabTitle}>Reject “{getContentTitle(focusedContent)}”</span>
          <KeystrokeDisplay keystroke="R" withMargin />
        </span>
      </div>}
      <div
        className={classNames(classes.tab, classes.dmTab)}
        onClick={handleSelectDmTab}
      >
        <span className={classNames(classes.tabLabel, { [classes.activeTab]: dmTabActive })}>
          Send DM
        </span>
      </div>
    </div>

    {showRejectTab && canReject && !rejectTabActive && highlightedRejectionTemplates.length > 0 && (
      <div className={classes.collapsedHighlightedTemplates}>
        {highlightedRejectionTemplates.map(template => (
          <div
            key={template._id}
            className={classes.collapsedHighlightedTemplate}
            onClick={() => handleCollapsedRejectTemplateClick(template)}
          >
            {template.name}
          </div>
        ))}
      </div>
    )}

    <div className={classNames({ [classes.hiddenTabContent]: !dmTabActive })}>
      {dmTabContents}
    </div>
    {canReject && focusedContent && (
      <div className={classNames({ [classes.hiddenTabContent]: !rejectTabActive })}>
        <RejectContentPanel
          user={user}
          focusedContent={focusedContent}
          active={rejectTabActive}
          onEscape={handleCloseSidebarTab}
          highlightedTemplateNames={highlightedTemplateNames}
          onRegisterToggleTemplate={registerRejectToggleTemplate}
        />
      </div>
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
