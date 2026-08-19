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
import { useDialog } from '../common/withDialog';
import { useAppendToEditor, AppendToEditorProvider } from '../editor/AppendToEditorContext';
import { getHighlightedRejectionTemplateIds, getHighlightedTemplateIds } from './supermod/templateHighlightRules';
import { useHighlightRuleOverrides } from './supermod/useHighlightRuleOverrides';
import FormatDate from '../common/FormatDate';
import GroupedModerationTemplateList from './GroupedModerationTemplateList';
import ModerationSectionTitle from './supermod/ModerationSectionTitle';
import RejectContentPanel from './supermod/RejectContentPanel';
import KeystrokeDisplay from './supermod/KeystrokeDisplay';
import ComposerKeydownWrapper from './supermod/ComposerKeydownWrapper';
import ComposerSubmitButton from './supermod/ComposerSubmitButton';
import { useGlobalKeydown } from '../common/withGlobalKeydown';
import { canRejectContent, getContentTitle, isInTextInput, type ContentItem } from './supermod/helpers';
import type { SelectedSidebarTab } from './supermod/sidebarTabs';
import { focusLexicalEditorAtEnd, focusLexicalEditorWhenReady } from '../editor/focusLexicalEditor';
import ModerationSidebarSection from './supermod/ModerationSidebarSection';

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

interface PendingConversationUpdate {
  count: number;
  latestActivity: string;
}

interface PendingConversationUpdates {
  [conversationId: string]: PendingConversationUpdate;
}

interface DisplayConversation {
  conversation: ConversationsList;
  optimistic: boolean;
}

function createOptimisticConversation({
  conversationId,
  title,
  messageCount,
  latestActivity,
  user,
  currentUser,
}: {
  conversationId: string;
  title: string | null;
  messageCount: number;
  latestActivity: string;
  user: SunshineUsersList;
  currentUser: UsersCurrent;
}): ConversationsList {
  return {
    __typename: 'Conversation',
    _id: conversationId,
    createdAt: latestActivity,
    latestActivity,
    title,
    participantIds: [user._id, currentUser._id],
    archivedByIds: [],
    messageCount,
    moderator: true,
    participants: [user, currentUser],
    latestMessage: null,
  };
}

function getDisplayedConversations({
  conversations,
  pendingMessageUpdates,
  pendingRejectionConversations,
  user,
  currentUser,
}: {
  conversations: ConversationsList[];
  pendingMessageUpdates: PendingConversationUpdates;
  pendingRejectionConversations: ConversationsList[];
  user: SunshineUsersList;
  currentUser: UsersCurrent;
}): DisplayConversation[] {
  const existingConversationIds = new Set(conversations.map(conversation => conversation._id));
  const updatedConversations = conversations.map(conversation => {
    const pendingUpdate = pendingMessageUpdates[conversation._id];
    return {
      conversation: pendingUpdate
        ? {
            ...conversation,
            messageCount: conversation.messageCount + pendingUpdate.count,
            latestActivity: pendingUpdate.latestActivity,
          }
        : conversation,
      optimistic: false,
    };
  });
  const newMessageConversations = Object.entries(pendingMessageUpdates)
    .filter(([conversationId]) => !existingConversationIds.has(conversationId))
    .map(([conversationId, update]) => ({
      conversation: createOptimisticConversation({
        conversationId,
        title: null,
        messageCount: update.count,
        latestActivity: update.latestActivity,
        user,
        currentUser,
      }),
      optimistic: true,
    }));
  const optimisticRejections = pendingRejectionConversations.map(conversation => ({
    conversation,
    optimistic: true,
  }));

  return [...optimisticRejections, ...newMessageConversations, ...updatedConversations]
    .sort((a, b) => new Date(b.conversation.latestActivity ?? 0).getTime() - new Date(a.conversation.latestActivity ?? 0).getTime());
}

const COLLAPSED_CONVERSATION_COUNT = 2;

const styles = defineStyles('SunshineUserMessages', (theme: ThemeType) => ({
  // Makes these three sections flex siblings of Moderator Actions in the
  // parent sidebar without adding another layout region.
  root: {
    display: 'contents',
  },
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
  optimisticConversationItem: {
    opacity: 0.7,
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
  sectionHeaderRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    marginBottom: 6,
  },
  minimalSectionHeaderRow: {
    marginBottom: 0,
  },
  emptySectionMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 0',
    color: theme.palette.grey[600],
    fontSize: 14,
  },
  sectionHeaderControls: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  },
  disabledSectionHeaderControls: {
    opacity: 0.4,
  },
  sectionToggleButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 0,
    background: 'none',
    color: theme.palette.grey[600],
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[800],
    },
    '&:disabled': {
      cursor: 'default',
    },
  },
  sectionChevron: {
    fontSize: 16,
  },
  loadMoreMessages: {
    padding: '2px 0',
    border: 0,
    background: 'none',
    color: theme.palette.grey[600],
    fontSize: 12,
    cursor: 'pointer',
    '&:hover': {
      color: theme.palette.grey[900],
    },
  },
  // Deselected composers stay mounted (so drafts survive), just hidden
  hiddenTabContent: {
    display: 'none',
  },
  collapsedSendButton: {
    marginTop: 4,
  },
}));

const CollapsibleSectionHeader = ({ title, keystroke, expanded, minimal = false, disabled = false, disabledTitle, onToggle }: {
  title: string,
  keystroke?: string,
  expanded: boolean,
  minimal?: boolean,
  disabled?: boolean,
  disabledTitle?: string,
  onToggle: () => void,
}) => {
  const classes = useStyles(styles);

  return <div className={classNames(classes.sectionHeaderRow, {
    [classes.minimalSectionHeaderRow]: minimal,
  })}>
    <ModerationSectionTitle>{title}</ModerationSectionTitle>
    <div className={classNames(classes.sectionHeaderControls, {
      [classes.disabledSectionHeaderControls]: disabled,
    })}>
      {keystroke && <KeystrokeDisplay keystroke={keystroke} />}
      <button
        type="button"
        className={classes.sectionToggleButton}
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? disabledTitle : expanded ? `Close ${title}` : `Open ${title}`}
        aria-label={expanded ? `Close ${title}` : `Open ${title}`}
        aria-expanded={expanded}
      >
        <ForumIcon
          icon={expanded ? "ThickChevronDown" : "ThickChevronRight"}
          className={classes.sectionChevron}
        />
      </button>
    </div>
  </div>;
};

interface SunshineUserMessagesProps {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts?: SunshinePostsList[];
  comments?: SunshineCommentsList[];
  focusedContent?: ContentItem | null;
  sidebarTab: SelectedSidebarTab;
  setSidebarTab: (tab: SelectedSidebarTab) => void;
  onRejectStart?: (content: ContentItem) => void;
  onRejectFailed?: (content: ContentItem) => void;
}

type EmptySection = 'userMessages' | 'reject';

const SunshineUserMessagesInner = ({user, currentUser, posts, comments, focusedContent, sidebarTab, setSidebarTab, onRejectStart, onRejectFailed}: SunshineUserMessagesProps) => {
  const classes = useStyles(styles);

  const { overrides: ruleOverrides } = useHighlightRuleOverrides();
  const highlightedMessageTemplateIds = useMemo(() => {
    if (!posts || !comments) return new Set<string>();
    return getHighlightedTemplateIds(
      {
        user,
        moderatorActions: user.moderatorActions ?? [],
        ruleOverrides,
      },
      posts,
      comments
    );
  }, [user, posts, comments, ruleOverrides]);

  const highlightedRejectionTemplateIds = useMemo(() => {
    if (!focusedContent || !posts || !comments) return new Set<string>();
    return getHighlightedRejectionTemplateIds(focusedContent, {
      user,
      moderatorActions: user.moderatorActions ?? [],
      posts,
      comments,
      ruleOverrides,
    });
  }, [focusedContent, user, posts, comments, ruleOverrides]);

  const [embeddedConversationId, setEmbeddedConversationId] = useState<string | undefined>();
  const [templateQueries, setTemplateQueries] = useState<TemplateQueryStrings | undefined>();
  // Templates whose text has been inserted into the draft message; drives the
  // checkboxes in the template list. Cleared when the message is sent.
  const [insertedMessageTemplateIds, setInsertedMessageTemplateIds] = useState<Set<string>>(new Set());
  const [expandedConversationId, setExpandedConversationId] = useState<string | undefined>();
  const [templateSearchToken, setTemplateSearchToken] = useState(0);
  const [pendingComposerFocus, setPendingComposerFocus] = useState(false);
  const [pendingMessageUpdates, setPendingMessageUpdates] = useState<PendingConversationUpdates>({});
  const [pendingRejectionConversations, setPendingRejectionConversations] = useState<ConversationsList[]>([]);
  const [openedEmptySection, setOpenedEmptySection] = useState<EmptySection | null>(null);
  const dmEditorContainerRef = useRef<HTMLDivElement>(null);
  const submittedMessageTemplateIdsRef = useRef<Set<string>>(new Set());

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

  const { data, loading: conversationsLoading, refetch } = useQuery(ConversationsListMultiQuery, {
    variables: {
      selector: { moderatorConversations: { userId: user._id } },
      limit: 10,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const results = data?.conversations?.results;
  const displayedConversations = useMemo(() => getDisplayedConversations({
    conversations: results ?? [],
    pendingMessageUpdates,
    pendingRejectionConversations,
    user,
    currentUser,
  }), [results, pendingMessageUpdates, pendingRejectionConversations, user, currentUser]);

  const canReject = canRejectContent(focusedContent);
  const conversationsLoaded = !conversationsLoading || !!data;
  const hasUserMessages = displayedConversations.length > 0;
  const userMessagesEmpty = conversationsLoaded && !hasUserMessages;
  const userMessagesActive = sidebarTab === 'userMessages'
    && (!userMessagesEmpty || openedEmptySection === 'userMessages');
  const rejectTabActive = sidebarTab === 'reject'
    && (canReject || openedEmptySection === 'reject');
  const dmTabActive = sidebarTab === 'dm';
  // With Rejections, Send Message, or Moderator Actions expanded, the other
  // two collapse to bare headers (no highlighted actions or submit buttons)
  // so the expanded section gets the full height
  const actionSectionExpanded = rejectTabActive || dmTabActive || sidebarTab === 'moderatorActions';
  // While an unrejected content item is selected, rejecting it is the primary
  // action: the section claims the free column height even before its tab is
  // opened, instead of splitting it evenly with the other highlighted
  // sections. An explicitly expanded section still takes priority.
  const rejectSectionFillsSpace = rejectTabActive || (canReject && sidebarTab === null);
  const visibleConversations = userMessagesActive
    ? displayedConversations
    : displayedConversations.slice(0, COLLAPSED_CONVERSATION_COUNT);
  const hiddenConversationCount = displayedConversations.length - visibleConversations.length;

  useEffect(() => {
    if (!userMessagesActive) {
      setExpandedConversationId(undefined);
    }
  }, [userMessagesActive]);

  useEffect(() => {
    if (openedEmptySection && sidebarTab !== openedEmptySection) {
      setOpenedEmptySection(null);
    }
  }, [openedEmptySection, sidebarTab]);

  // Once the focused item has been rejected (and no rejectable item has taken
  // its place), the open reject tab has nothing left to show; close it so the
  // whole section collapses instead of leaving the sidebar stuck with every
  // section reduced to a bare header. Deliberately opening the tab's empty
  // state ("Nothing to reject") is exempt.
  useEffect(() => {
    if (sidebarTab === 'reject' && !canReject && openedEmptySection !== 'reject') {
      setSidebarTab(null);
    }
  }, [sidebarTab, canReject, openedEmptySection, setSidebarTab]);

  const handleToggleUserMessages = () => {
    if (userMessagesActive) {
      setOpenedEmptySection(null);
      setSidebarTab(null);
    } else {
      setOpenedEmptySection(userMessagesEmpty ? 'userMessages' : null);
      setSidebarTab('userMessages');
    }
  };

  const handleToggleReject = () => {
    if (rejectTabActive) {
      setOpenedEmptySection(null);
      setSidebarTab(null);
    } else {
      setOpenedEmptySection(canReject ? null : 'reject');
      setSidebarTab('reject');
    }
  };

  const handleStartConversation = useCallback(() => {
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
    }
  }, [embeddedConversationId, initiateConversation, user._id]);

  // Start the conversation on tab click, not on a second click on the prompt.
  // Clicking the already-active tab closes the composer.
  const handleSelectDmTab = useCallback(() => {
    if (dmTabActive) {
      setSidebarTab(null);
      return;
    }
    setSidebarTab('dm');
    handleStartConversation();
  }, [dmTabActive, setSidebarTab, handleStartConversation]);

  const { isDialogOpen } = useDialog();

  // Shift+M toggles the Send DM composer from anywhere in the inbox, mirroring
  // the R shortcut for the reject panel
  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if (isDialogOpen) return;
    if (e.key.toLowerCase() !== 'm' || !e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isInTextInput(e.target)) return;
    e.preventDefault();
    handleSelectDmTab();
  }, [isDialogOpen, handleSelectDmTab]));

  // The message form registers its submit function here so the collapsed Send
  // Message button (and Cmd+M) can send the draft without the composer open
  const submitMessageRef = useRef<() => void>(() => {});
  const registerSubmitMessage = useCallback((fn: () => void) => {
    submitMessageRef.current = fn;
  }, []);

  const finishPendingMessage = useCallback((conversationId: string) => {
    setPendingMessageUpdates(previousUpdates => {
      const update = previousUpdates[conversationId];
      if (!update) return previousUpdates;
      if (update.count > 1) {
        return {
          ...previousUpdates,
          [conversationId]: { ...update, count: update.count - 1 },
        };
      }
      const nextUpdates = { ...previousUpdates };
      delete nextUpdates[conversationId];
      return nextUpdates;
    });
  }, []);

  const handleMessageSubmitStart = useCallback(() => {
    if (!embeddedConversationId) return;
    submittedMessageTemplateIdsRef.current = insertedMessageTemplateIds;
    setInsertedMessageTemplateIds(new Set());
    const latestActivity = new Date().toISOString();
    setPendingMessageUpdates(previousUpdates => ({
      ...previousUpdates,
      [embeddedConversationId]: {
        count: (previousUpdates[embeddedConversationId]?.count ?? 0) + 1,
        latestActivity,
      },
    }));
  }, [embeddedConversationId, insertedMessageTemplateIds]);

  const handleMessageSubmitFailed = useCallback(() => {
    if (!embeddedConversationId) return;
    finishPendingMessage(embeddedConversationId);
    setInsertedMessageTemplateIds(new Set(submittedMessageTemplateIdsRef.current));
  }, [embeddedConversationId, finishPendingMessage]);

  const handleMessageSent = useCallback((newMessage: messageListFragment) => {
    const conversationId = newMessage.conversationId ?? embeddedConversationId;
    if (conversationId) {
      void refetch().finally(() => finishPendingMessage(conversationId));
    }
    captureEvent('messageSent', {
      conversationId: newMessage.conversationId,
      sender: currentUser._id,
      moderatorConveration: true
    });
  }, [embeddedConversationId, refetch, finishPendingMessage, captureEvent, currentUser._id]);

  // The conversation check keeps the button disabled during the window between
  // clicking a template and the message form mounting, when the submit ref is
  // still a no-op
  const canSendDraftMessage = insertedMessageTemplateIds.size > 0 && !!embeddedConversationId;

  // Cmd/Ctrl+M sends the drafted message from anywhere in the inbox, mirroring
  // Cmd+R for rejections; until a template is inserted the key does nothing.
  // Skipped while typing: the composer has Ctrl+Enter for that, and lexical
  // itself binds Cmd+M (insert display math).
  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if (isDialogOpen || !canSendDraftMessage) return;
    if ((e.metaKey || e.ctrlKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === 'm') {
      if (isInTextInput(e.target)) return;
      e.preventDefault();
      submitMessageRef.current();
    }
  }, [isDialogOpen, canSendDraftMessage]));

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
    // Already in the draft: clicking again would just append a duplicate copy
    if (insertedMessageTemplateIds.has(template._id)) return;
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
      // Only the latest pre-conversation click gets prefilled into the new form
      setInsertedMessageTemplateIds(new Set([template._id]));
    } else if (template.contents?.html) {
      const processedHtml = getDraftMessageHtml({
        html: template.contents.html,
        displayName: user.displayName,
      });
      appendToEditor(processedHtml);
      setInsertedMessageTemplateIds(prev => new Set(prev).add(template._id));
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

  const removePendingRejectionConversation = useCallback((contentId: string) => {
    setPendingRejectionConversations(conversations =>
      conversations.filter(conversation => conversation._id !== `optimistic-rejection-${contentId}`)
    );
  }, []);

  // A rejection creates a new moderator conversation on the server. Show that
  // conversation immediately, then replace it with the real result once the
  // mutation (including its rejection PM) completes.
  const handleContentRejectStart = useCallback((content: ContentItem) => {
    const latestActivity = new Date().toISOString();
    const optimisticConversation = createOptimisticConversation({
      conversationId: `optimistic-rejection-${content._id}`,
      title: `Rejection of ${getContentTitle(content)}`,
      messageCount: 1,
      latestActivity,
      user,
      currentUser,
    });
    setPendingRejectionConversations(conversations => [
      optimisticConversation,
      ...conversations.filter(conversation => conversation._id !== optimisticConversation._id),
    ]);
    onRejectStart?.(content);
  }, [user, currentUser, onRejectStart]);

  const handleContentRejected = useCallback((content: ContentItem) => {
    void refetch().finally(() => removePendingRejectionConversation(content._id));
  }, [refetch, removePendingRejectionConversation]);

  const handleContentRejectFailed = useCallback((content: ContentItem) => {
    removePendingRejectionConversation(content._id);
    onRejectFailed?.(content);
  }, [removePendingRejectionConversation, onRejectFailed]);

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
          registerSubmit={registerSubmitMessage}
          optimisticEvent={handleMessageSubmitStart}
          failureEvent={handleMessageSubmitFailed}
          successEvent={handleMessageSent}
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
      highlightedTemplateIds={highlightedMessageTemplateIds}
      insertedTemplateIds={insertedMessageTemplateIds}
      onFocusComposer={handleFocusComposer}
      focusSearchToken={templateSearchToken}
      active={dmTabActive}
      onEscape={handleCloseSidebarTab}
    />
  </>;

  return <div className={classes.root}>
    <ModerationSidebarSection>
      <CollapsibleSectionHeader
        title="User Messages"
        expanded={userMessagesActive}
        minimal={userMessagesEmpty && !userMessagesActive}
        onToggle={handleToggleUserMessages}
      />
      {visibleConversations.map(({ conversation, optimistic }) => {
        const isExpanded = expandedConversationId === conversation._id;
        const conversationItem = (
            <div className={classNames(classes.conversationItem, { [classes.optimisticConversationItem]: optimistic })}>
              <div className={classes.conversationHeader} onClick={optimistic ? undefined : () => toggleConversationPreview(conversation._id)}>
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
                {!optimistic && <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
                  <ForumIcon icon="Link" className={classes.linkIcon} />
                </Link>}
                {!optimistic && <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />}
              </div>
              {!optimistic && isExpanded && (
                <ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth />
              )}
            </div>
        );
        return optimistic ? (
          <React.Fragment key={conversation._id}>{conversationItem}</React.Fragment>
        ) : (
          <LWTooltip key={conversation._id} placement="left-start" tooltip={false} titleClassName={classes.conversationPreviewTooltip} title={<div><ConversationPreview conversationId={conversation._id} showTitle={false} showFullWidth /></div>}>
            {conversationItem}
          </LWTooltip>
        );
      })}
      {hiddenConversationCount > 0 && (
        <button
          type="button"
          className={classes.loadMoreMessages}
          onClick={() => setSidebarTab('userMessages')}
        >
          Load {hiddenConversationCount} more
        </button>
      )}
      {userMessagesEmpty && userMessagesActive && (
        <div className={classes.emptySectionMessage}>
          No Conversations
        </div>
      )}
    </ModerationSidebarSection>

    <ModerationSidebarSection
      fillsAvailableSpace={rejectSectionFillsSpace}
      hasHighlightedItems={canReject && highlightedRejectionTemplateIds.size > 0}
    >
      <CollapsibleSectionHeader
        title="Rejections"
        keystroke="R"
        expanded={rejectTabActive}
        minimal={!canReject && !rejectTabActive}
        onToggle={handleToggleReject}
      />
      {canReject && focusedContent ? (
        <RejectContentPanel
          user={user}
          focusedContent={focusedContent}
          active={rejectTabActive}
          highlightedTemplateIds={highlightedRejectionTemplateIds}
          showCollapsedActions={!actionSectionExpanded}
          onRejectStart={handleContentRejectStart}
          onRejected={handleContentRejected}
          onRejectFailed={handleContentRejectFailed}
          onEscape={handleCloseSidebarTab}
        />
      ) : rejectTabActive ? (
        <div className={classes.emptySectionMessage}>Nothing to reject</div>
      ) : null}
    </ModerationSidebarSection>

    <ModerationSidebarSection
      fillsAvailableSpace={dmTabActive}
      hasHighlightedItems={highlightedMessageTemplateIds.size > 0}
    >
      <CollapsibleSectionHeader
        title="Send Message"
        keystroke="Shift+M"
        expanded={dmTabActive}
        onToggle={handleSelectDmTab}
      />
      {!dmTabActive && !actionSectionExpanded && (
        <GroupedModerationTemplateList
          collectionName="Messages"
          onTemplateClick={handleMessageTemplateClick}
          highlightedTemplateIds={highlightedMessageTemplateIds}
          insertedTemplateIds={insertedMessageTemplateIds}
          onlyHighlighted
          active={false}
        />
      )}
      <div className={classNames({ [classes.hiddenTabContent]: !dmTabActive })}>
        {dmTabContents}
      </div>
      {!dmTabActive && !actionSectionExpanded && highlightedMessageTemplateIds.size > 0 && (
        <div className={classes.collapsedSendButton}>
          <ComposerSubmitButton
            label="Send Message"
            keystroke="Ctrl+M"
            disabled={!canSendDraftMessage}
            onClick={() => submitMessageRef.current()}
          />
        </div>
      )}
    </ModerationSidebarSection>
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
