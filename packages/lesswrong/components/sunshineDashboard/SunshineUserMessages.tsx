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
import { getHighlightedTemplateNames } from './supermod/templateHighlightRules';
import FormatDate from '../common/FormatDate';
import GroupedModerationTemplateList from './GroupedModerationTemplateList';
import CollapsibleSectionHeader from './supermod/CollapsibleSectionHeader';
import RejectContentPanel from './supermod/RejectContentPanel';
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
  // Makes the sections flex children of the parent sidebar
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
    // Undo the editor wrapper's 100px min-height so the composer starts one line tall
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
  emptySectionMessage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 0',
    color: theme.palette.grey[600],
    fontSize: 14,
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

  const highlightedMessageTemplateNames = useMemo(() => {
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
  // Drives the template list's checkboxes
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
  const userMessagesEmpty = conversationsLoaded && displayedConversations.length === 0;
  const userMessagesActive = sidebarTab === 'userMessages'
    && (!userMessagesEmpty || openedEmptySection === 'userMessages');
  const rejectTabActive = sidebarTab === 'reject'
    && (canReject || openedEmptySection === 'reject');
  const dmTabActive = sidebarTab === 'dm';
  // Expanding one of these collapses the others to bare headers
  const actionSectionExpanded = rejectTabActive || dmTabActive || sidebarTab === 'moderatorActions';
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

  // Close Rejections once nothing is rejectable, unless its empty state was opened deliberately
  useEffect(() => {
    if (sidebarTab === 'reject' && !canReject && openedEmptySection !== 'reject') {
      setSidebarTab(null);
    }
  }, [sidebarTab, canReject, openedEmptySection, setSidebarTab]);

  const toggleSection = (section: EmptySection, isActive: boolean, isEmpty: boolean) => {
    setOpenedEmptySection(!isActive && isEmpty ? section : null);
    setSidebarTab(isActive ? null : section);
  };

  const handleStartConversation = useCallback(() => {
    if (!embeddedConversationId) {
      initiateConversation([user._id]);
    }
  }, [embeddedConversationId, initiateConversation, user._id]);

  const handleSelectDmTab = useCallback(() => {
    if (dmTabActive) {
      setSidebarTab(null);
      return;
    }
    setSidebarTab('dm');
    handleStartConversation();
  }, [dmTabActive, setSidebarTab, handleStartConversation]);

  const { isDialogOpen } = useDialog();

  useGlobalKeydown(useCallback((e: KeyboardEvent) => {
    if (isDialogOpen) return;
    if (e.key.toLowerCase() !== 'm' || !e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
    if (isInTextInput(e.target)) return;
    e.preventDefault();
    handleSelectDmTab();
  }, [isDialogOpen, handleSelectDmTab]));

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

  // Until the conversation exists the form isn't mounted, so submitMessageRef is a no-op
  const canSendDraftMessage = insertedMessageTemplateIds.size > 0 && !!embeddedConversationId;

  // Ignored while typing: the composer has Ctrl+Enter, and lexical binds Cmd+M (display math)
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

  // Show the rejection's new moderator conversation until the refetch returns the real one
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
      highlightedTemplateNames={highlightedMessageTemplateNames}
      insertedTemplateIds={insertedMessageTemplateIds}
      onFocusComposer={handleFocusComposer}
      focusSearchToken={templateSearchToken}
      active={dmTabActive}
      onEscape={handleCloseSidebarTab}
    />
  </>;

  return <div className={classes.root}>
    <ModerationSidebarSection
      header={<CollapsibleSectionHeader
        title="User Messages"
        expanded={userMessagesActive}
        minimal={userMessagesEmpty && !userMessagesActive}
        onToggle={() => toggleSection('userMessages', userMessagesActive, userMessagesEmpty)}
      />}
    >
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
                {!optimistic && <>
                  <Link to={`/inbox?isModInbox=true&conversation=${conversation._id}`} onClick={(e) => e.stopPropagation()}>
                    <ForumIcon icon="Link" className={classes.linkIcon} />
                  </Link>
                  <ForumIcon icon={isExpanded ? "ExpandLess" : "ExpandMore"} className={classes.expandIcon} />
                </>}
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
      fillsAvailableSpace={rejectTabActive}
      sharesAvailableSpace
      header={<CollapsibleSectionHeader
        title="Rejections"
        keystroke="R"
        expanded={rejectTabActive}
        minimal={!canReject && !rejectTabActive}
        onToggle={() => toggleSection('reject', rejectTabActive, !canReject)}
      />}
    >
      {canReject && focusedContent ? (
        <RejectContentPanel
          user={user}
          focusedContent={focusedContent}
          active={rejectTabActive}
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
      sharesAvailableSpace
      header={<CollapsibleSectionHeader
        title="Send Message"
        keystroke="Shift+M"
        expanded={dmTabActive}
        onToggle={handleSelectDmTab}
      />}
    >
      {!actionSectionExpanded && (
        <GroupedModerationTemplateList
          collectionName="Messages"
          onTemplateClick={handleMessageTemplateClick}
          highlightedTemplateNames={highlightedMessageTemplateNames}
          insertedTemplateIds={insertedMessageTemplateIds}
          onlyHighlighted
          active={false}
        />
      )}
      <div className={classNames({ [classes.hiddenTabContent]: !dmTabActive })}>
        {dmTabContents}
      </div>
      {!actionSectionExpanded && highlightedMessageTemplateNames.size > 0 && (
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
