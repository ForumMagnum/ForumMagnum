'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, UIMessage } from 'ai';
import { useMutation, useApolloClient } from '@apollo/client/react';
import classNames from 'classnames';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import { useSpeechRecognition } from '@/components/hooks/useSpeechRecognition';
import AgentProposalCard from './AgentProposalCard';
import SupermodAgentChatHistory from './SupermodAgentChatHistory';
import { useApplyModerationProposal } from './useApplyModerationProposal';
import { supermodAgentModels, defaultSupermodAgentModel } from '@/lib/collections/moderationAgentConversations/agentModels';
import { renderAgentMarkdown } from './agentMarkdown';

const CreateAgentConversationMutation = gql(`
  mutation createModerationAgentConversationChatPanel($data: CreateModerationAgentConversationDataInput!) {
    createModerationAgentConversation(data: $data) {
      data {
        ...ModerationAgentConversationInfo
      }
    }
  }
`);

const READ_TOOL_LABELS: Record<string, string> = {
  'tool-read_document_body': 'Read more of a post/comment',
  'tool-get_user_dossier': 'Read the user dossier',
  'tool-find_alt_accounts': 'Checked for alt accounts',
  'tool-get_user_content': 'Read the user\'s content',
  'tool-get_moderator_action_history': 'Read moderator action history',
  'tool-list_moderation_templates': 'Read moderation templates',
  'tool-list_review_queue': 'Listed the review queue',
  'tool-get_moderation_summaries': 'Read saved summaries and proposals',
  'tool-get_lore': 'Read moderation lore',
  'tool-save_user_summary': 'Saved a user summary',
  'tool-save_user_grouping': 'Saved a user grouping',
  'tool-append_llm_note': 'Added an LLM note',
  'tool-edit_lore_document': 'Edited a lore document',
};

const PROPOSAL_TOOL_TYPES = ['tool-file_moderation_proposal', 'tool-update_moderation_proposal'];

interface ProposalToolInput {
  title?: string;
  rationale?: string;
  steps?: unknown;
}

function parseProposalToolOutput(output: unknown): { proposalId?: string; status?: string } {
  if (typeof output !== 'string') return {};
  try {
    const parsed = JSON.parse(output);
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

const styles = defineStyles('SupermodAgentChatPanel', (theme: ThemeType) => ({
  // Floating overlay in the bottom-right corner, matching the site-wide
  // popup LLM chat's placement (supermod hides the site's own floating
  // buttons, so the corner is ours).
  root: {
    ...theme.typography.commentStyle,
    position: 'fixed',
    right: 8,
    bottom: 8,
    width: 440,
    height: 'min(720px, calc(100vh - 80px))',
    maxHeight: 'calc(100vh - 80px)',
    zIndex: theme.zIndexes.languageModelChat,
    display: 'flex',
    flexDirection: 'column',
    border: theme.palette.border.normal,
    borderRadius: 8,
    boxShadow: `0 1px 6px 0 ${theme.palette.greyAlpha(0.06)}, 0 2px 32px 0 ${theme.palette.greyAlpha(0.16)}`,
    backgroundColor: theme.palette.background.paper,
    overflow: 'hidden',
  },
  resizeHandle: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 6,
    cursor: 'ns-resize',
    touchAction: 'none',
    zIndex: 1,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderBottom: theme.palette.border.normal,
    backgroundColor: theme.palette.grey[50],
    flexShrink: 0,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: 600,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  headerButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  modelSelect: {
    fontSize: 11.5,
    fontFamily: 'inherit',
    color: theme.palette.grey[600],
    border: theme.palette.border.faint,
    borderRadius: 4,
    padding: '2px 4px',
    backgroundColor: theme.palette.background.default,
    cursor: 'pointer',
    marginRight: 4,
  },
  headerButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    fontSize: 13,
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '10px 14px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },
  emptyState: {
    color: theme.palette.grey[600],
    fontSize: 13,
    marginTop: 24,
    textAlign: 'center',
    padding: '0 12px',
  },
  message: {
    fontSize: 13.5,
    lineHeight: 1.45,
    whiteSpace: 'pre-wrap',
    overflowWrap: 'break-word',
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '88%',
    backgroundColor: theme.palette.grey[110],
    borderRadius: 8,
    padding: '6px 10px',
  },
  assistantMessage: {
    alignSelf: 'stretch',
  },
  // Rendered markdown: undo the plain-text pre-wrap and give block elements
  // sane compact spacing for a chat pane
  markdownMessage: {
    whiteSpace: 'normal',
    '& p, & ul, & ol, & pre, & blockquote, & table': {
      marginTop: 0,
      marginBottom: 8,
    },
    '& :last-child': {
      marginBottom: 0,
    },
    '& h1, & h2, & h3, & h4': {
      fontSize: 14,
      fontWeight: 600,
      marginTop: 12,
      marginBottom: 6,
    },
    '& ul, & ol': {
      paddingLeft: 20,
    },
    '& li': {
      marginBottom: 2,
    },
    '& code': {
      fontSize: 12,
      backgroundColor: theme.palette.grey[100],
      padding: '1px 4px',
      borderRadius: 3,
    },
    '& pre': {
      fontSize: 12,
      backgroundColor: theme.palette.grey[100],
      padding: 8,
      borderRadius: 4,
      overflowX: 'auto',
    },
    '& blockquote': {
      borderLeft: `3px solid ${theme.palette.grey[300]}`,
      paddingLeft: 8,
      marginLeft: 0,
      color: theme.palette.grey[600],
    },
    '& a': {
      color: theme.palette.primary.main,
    },
    '& hr': {
      border: 'none',
      borderTop: theme.palette.border.faint,
      margin: '10px 0',
    },
  },
  toolChip: {
    fontSize: 11.5,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
  },
  chatError: {
    fontSize: 12.5,
    color: theme.palette.error.main,
    border: `1px solid ${theme.palette.error.main}`,
    borderRadius: 6,
    padding: '6px 10px',
    overflowWrap: 'break-word',
  },
  // Display-only notice in the transcript (not sent to the model)
  noticeMessage: {
    fontSize: 12.5,
    color: theme.palette.grey[600],
    fontStyle: 'italic',
    border: theme.palette.border.faint,
    borderRadius: 6,
    padding: '6px 10px',
    backgroundColor: theme.palette.grey[100],
  },
  typingIndicator: {
    display: 'flex',
    gap: 4,
    padding: '4px 0',
    '& span': {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: theme.palette.grey[500],
      animation: '$agentChatBounce 1.2s infinite',
    },
    '& span:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '& span:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
  '@keyframes agentChatBounce': {
    '0%, 60%, 100%': { opacity: 0.3 },
    '30%': { opacity: 1 },
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    padding: '10px 14px',
    borderTop: theme.palette.border.normal,
    flexShrink: 0,
  },
  interimTranscript: {
    fontSize: 12,
    color: theme.palette.grey[500],
    fontStyle: 'italic',
    minHeight: 0,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 6,
  },
  inputButtons: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
  },
  input: {
    flex: 1,
    minHeight: 60,
    maxHeight: 160,
    resize: 'vertical',
    fontSize: 13.5,
    lineHeight: 1.4,
    fontFamily: 'inherit',
    padding: '8px 10px',
    borderRadius: 6,
    border: theme.palette.border.normal,
    outline: 'none',
    color: theme.palette.text.normal,
    backgroundColor: theme.palette.background.default,
    '&:focus': {
      borderColor: theme.palette.primary.main,
    },
  },
  micButton: {
    background: 'none',
    border: theme.palette.border.normal,
    borderRadius: 6,
    cursor: 'pointer',
    padding: 6,
    display: 'flex',
    justifyContent: 'center',
    color: theme.palette.grey[600],
    '&:hover': {
      color: theme.palette.text.normal,
    },
    '& svg': {
      width: 18,
      height: 18,
    },
  },
  micButtonActive: {
    color: theme.palette.error.main,
    borderColor: theme.palette.error.main,
    animation: '$agentChatPulse 1.4s infinite',
  },
  '@keyframes agentChatPulse': {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },
  sendButton: {
    padding: '8px 12px',
    fontSize: 13,
    fontWeight: 600,
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.text.alwaysWhite,
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
}));

interface UserChatCacheEntry {
  conversationId: string | null;
  messages: UIMessage[];
}

/**
 * The supermod moderation-agent chat: a docked panel scoped to the opened
 * user. The moderator asks questions or dictates a plan; the agent reads
 * moderation data via server-side tools and files proposals, which render
 * here as cards (and in the sidebar) with Apply/Dismiss.
 */
const SupermodAgentChatPanel = ({ user, currentUser, posts, comments, addToUndoQueue, focusRequest, seedMessage, onSeedConsumed, autoSendMessage, onAutoSendConsumed, onClose }: {
  user: SunshineUsersList;
  currentUser: UsersCurrent;
  posts: SunshinePostsList[];
  comments: CommentsListWithParentMetadata[];
  addToUndoQueue: (actionLabel: string, executeAction: () => Promise<void>) => void;
  focusRequest: number;
  /** Display-only notice to show in the transcript on open (from a proposal card's Discuss button); not sent to the model */
  seedMessage: string | null;
  onSeedConsumed: () => void;
  /** Message to actually send to the agent on open (Generate button, voice submissions); newConversation starts fresh first */
  autoSendMessage: { message: string; newConversation?: boolean } | null;
  onAutoSendConsumed: () => void;
  onClose: () => void;
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const apolloClient = useApolloClient();
  const [createConversation] = useMutation(CreateAgentConversationMutation);

  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatCacheRef = useRef(new Map<string, UserChatCacheEntry>());
  const refetchedProposalToolCallIds = useRef(new Set<string>());
  const [resolvedProposalIds, setResolvedProposalIds] = useState<Set<string>>(new Set());

  const userIdRef = useRef(user._id);
  userIdRef.current = user._id;
  const conversationIdRef = useRef<string | null>(chatCacheRef.current.get(user._id)?.conversationId ?? null);

  const [model, setModel] = useState(defaultSupermodAgentModel);
  const modelRef = useRef(model);
  modelRef.current = model;

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/supermodAgentChat',
    body: () => ({
      targetUserId: userIdRef.current,
      conversationId: conversationIdRef.current,
      model: modelRef.current,
    }),
  }), []);

  const [chatError, setChatError] = useState<string | null>(null);
  // Display-only notices shown inline in the transcript (like errors): never
  // sent to the model, never persisted. "Discuss" on a proposal card adds one.
  const [notices, setNotices] = useState<string[]>([]);

  // Drag-to-resize via the strip along the panel's top edge. null = the
  // default CSS height; a number is an explicit height in px (the CSS
  // maxHeight still caps it if the window shrinks).
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const resizeStateRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const handleResizePointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!panelRef.current) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeStateRef.current = {
      startY: event.clientY,
      startHeight: panelRef.current.getBoundingClientRect().height,
    };
  }, []);

  const handleResizePointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const resizeState = resizeStateRef.current;
    if (!resizeState) return;
    const proposedHeight = resizeState.startHeight + (resizeState.startY - event.clientY);
    setPanelHeight(Math.max(320, Math.min(window.innerHeight - 80, proposedHeight)));
  }, []);

  const handleResizePointerEnd = useCallback(() => {
    resizeStateRef.current = null;
  }, []);

  const { messages, sendMessage, setMessages, status } = useChat({
    transport,
    onError: (error) => {
      setChatError(error.message || 'Agent chat error');
    },
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Keep the latest messages in the per-user cache so switching users
  // round-trips cleanly.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;

  const previousUserIdRef = useRef(user._id);
  useEffect(() => {
    const previousUserId = previousUserIdRef.current;
    if (previousUserId === user._id) return;
    chatCacheRef.current.set(previousUserId, {
      conversationId: conversationIdRef.current,
      messages: messagesRef.current,
    });
    const cached = chatCacheRef.current.get(user._id);
    conversationIdRef.current = cached?.conversationId ?? null;
    setMessages(cached?.messages ?? []);
    setChatError(null);
    setNotices([]);
    stickToBottomRef.current = true;
    previousUserIdRef.current = user._id;
  }, [user._id, setMessages]);

  // Auto-scroll on new content, but only while the user is at the bottom:
  // scrolling up to read during a stream must not get yanked back down.
  // "Scrolled up" is detected as a scrollTop decrease — our own smooth
  // scrollIntoView only ever moves down, so mid-animation scroll events
  // can't unpin.
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const lastScrollTopRef = useRef(0);

  const handleMessagesScroll = useCallback(() => {
    const container = messagesScrollRef.current;
    if (!container) return;
    const scrolledUp = container.scrollTop < lastScrollTopRef.current;
    lastScrollTopRef.current = container.scrollTop;
    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 60;
    if (nearBottom) {
      stickToBottomRef.current = true;
    } else if (scrolledUp) {
      stickToBottomRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!stickToBottomRef.current) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus the input when requested via the keyboard command
  useEffect(() => {
    if (focusRequest > 0) {
      textareaRef.current?.focus();
    }
  }, [focusRequest]);

  // When a proposal tool call completes, refresh the sidebar's pending list
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
        if (
          PROPOSAL_TOOL_TYPES.includes(part.type) &&
          'state' in part &&
          part.state === 'output-available' &&
          'toolCallId' in part &&
          !refetchedProposalToolCallIds.current.has(part.toolCallId)
        ) {
          refetchedProposalToolCallIds.current.add(part.toolCallId);
          void apolloClient.refetchQueries({ include: ['multiModerationProposalsForUserQuery'] });
        }
      }
    }
  }, [messages, apolloClient]);

  const { applyProposal, dismissProposal } = useApplyModerationProposal({
    user, currentUser, posts, comments, addToUndoQueue,
  });

  const sendText = useCallback(async (text: string): Promise<boolean> => {
    setChatError(null);
    if (!conversationIdRef.current) {
      const { data } = await createConversation({
        variables: {
          data: {
            userId: currentUser._id,
            targetUserId: userIdRef.current,
            model: modelRef.current,
          },
        },
      });
      const conversationId = data?.createModerationAgentConversation?.data?._id;
      if (!conversationId) {
        flash({ messageString: 'Failed to start agent conversation' });
        return false;
      }
      conversationIdRef.current = conversationId;
    }
    // Sending re-pins the view to the bottom even if the user had scrolled up
    stickToBottomRef.current = true;
    void sendMessage({ text });
    return true;
  }, [createConversation, currentUser._id, flash, sendMessage]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput('');
    const sent = await sendText(text);
    if (!sent) setInput(text);
  }, [input, isLoading, sendText]);

  // A "Discuss" click on a proposal card adds a display-only notice
  useEffect(() => {
    if (!seedMessage) return;
    onSeedConsumed();
    setNotices((previous) => [...previous, seedMessage]);
    textareaRef.current?.focus();
  }, [seedMessage, onSeedConsumed]);

  // "Generate" clicks and voice submissions send a real message to the agent,
  // optionally into a fresh conversation
  useEffect(() => {
    if (!autoSendMessage || isLoading) return;
    onAutoSendConsumed();
    if (autoSendMessage.newConversation) {
      conversationIdRef.current = null;
      chatCacheRef.current.delete(userIdRef.current);
      setMessages([]);
      setChatError(null);
    }
    void sendText(autoSendMessage.message);
  }, [autoSendMessage, isLoading, sendText, onAutoSendConsumed, setMessages]);

  const { isSupported: speechSupported, isListening, interimTranscript, toggle: toggleDictation, stop: stopDictation } = useSpeechRecognition({
    onFinalTranscript: (text) => setInput((previous) => previous + text),
    onError: (error) => flash({ messageString: error }),
  });

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Escape') {
      // First Escape leaves the chat (restoring single-key shortcuts) without
      // closing the detail view; stopPropagation shields the document-level
      // supermod Escape handler.
      event.stopPropagation();
      textareaRef.current?.blur();
      return;
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      stopDictation();
      void handleSend();
    }
  }, [handleSend, stopDictation]);

  const markProposalResolved = useCallback((proposalId: string) => {
    setResolvedProposalIds((previous) => new Set(previous).add(proposalId));
  }, []);

  const lastMessage = messages[messages.length - 1];
  const showTypingIndicator = isLoading && !(lastMessage?.role === 'assistant' && lastMessage.parts.some(
    (part) => (part.type === 'text' && part.text.trim()) || part.type.startsWith('tool-')
  ));

  return (
    <aside className={classes.root} ref={panelRef} style={panelHeight !== null ? { height: panelHeight } : undefined}>
      <div
        className={classes.resizeHandle}
        onPointerDown={handleResizePointerDown}
        onPointerMove={handleResizePointerMove}
        onPointerUp={handleResizePointerEnd}
        onPointerCancel={handleResizePointerEnd}
      />
      <div className={classes.header}>
        <span className={classes.headerTitle}>Agent — {user.displayName}</span>
        <div className={classes.headerButtons}>
          <select
            className={classes.modelSelect}
            value={model}
            onChange={(event) => setModel(event.target.value)}
            title="Model for subsequent messages"
          >
            {supermodAgentModels.map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
          <button type="button" className={classes.headerButton} title="New conversation" onClick={() => {
            conversationIdRef.current = null;
            chatCacheRef.current.delete(user._id);
            setMessages([]);
          }}>
            + New
          </button>
          <button type="button" className={classes.headerButton} title="Close (T reopens)" onClick={onClose}>
            &times;
          </button>
        </div>
      </div>
      <div className={classes.messages} ref={messagesScrollRef} onScroll={handleMessagesScroll}>
        {messages.length === 0 && (
          <>
            <div className={classes.emptyState}>
              Full user content and any moderation proposals are already in context.
            </div>
            <SupermodAgentChatHistory
              targetUserId={user._id}
              currentUserId={currentUser._id}
              onSelect={(conversation, loadedMessages) => {
                conversationIdRef.current = conversation._id;
                // Update the per-user cache too, so switching users away and
                // back doesn't resurrect the pre-load (empty) cache entry.
                chatCacheRef.current.set(user._id, {
                  conversationId: conversation._id,
                  messages: loadedMessages,
                });
                setMessages(loadedMessages);
                setChatError(null);
              }}
            />
          </>
        )}
        {messages.map((message) => (
          <React.Fragment key={message.id}>
            {message.parts.map((part, partIndex) => {
              const key = `${message.id}-${partIndex}`;
              if (part.type === 'text' && part.text.trim()) {
                if (message.role === 'assistant') {
                  return (
                    <div
                      key={key}
                      className={classNames(classes.message, classes.assistantMessage, classes.markdownMessage)}
                      dangerouslySetInnerHTML={{ __html: renderAgentMarkdown(part.text) }}
                    />
                  );
                }
                return (
                  <div key={key} className={classNames(classes.message, classes.userMessage)}>
                    {part.text}
                  </div>
                );
              }
              if (PROPOSAL_TOOL_TYPES.includes(part.type) && 'state' in part) {
                const toolInput = ('input' in part ? part.input ?? {} : {}) as ProposalToolInput;
                const toolOutput = part.state === 'output-available' && 'output' in part
                  ? parseProposalToolOutput(part.output)
                  : {};
                const proposalId = toolOutput.proposalId ?? null;
                const isResolved = !!proposalId && resolvedProposalIds.has(proposalId);
                return (
                  <AgentProposalCard
                    key={key}
                    posts={posts}
                    comments={comments}
                    proposal={{
                      _id: proposalId,
                      targetUserId: user._id,
                      title: toolInput.title,
                      rationale: toolInput.rationale,
                      steps: toolInput.steps,
                      status: isResolved ? 'applied' : (proposalId ? 'pending' : null),
                    }}
                    isStreaming={part.state !== 'output-available'}
                    canApply
                    onApply={(selectedIndexes) => {
                      if (!proposalId) return;
                      applyProposal({ _id: proposalId, targetUserId: user._id, title: toolInput.title ?? null, steps: toolInput.steps }, selectedIndexes);
                      markProposalResolved(proposalId);
                    }}
                    onDismiss={() => {
                      if (!proposalId) return;
                      void dismissProposal(proposalId);
                      markProposalResolved(proposalId);
                    }}
                  />
                );
              }
              if (part.type.startsWith('tool-') || part.type === 'dynamic-tool') {
                const label = READ_TOOL_LABELS[part.type] ?? 'Used a tool';
                const isDone = 'state' in part && (part.state === 'output-available' || part.state === 'output-error');
                return (
                  <div key={key} className={classes.toolChip}>
                    {isDone ? label : `${label}…`}
                  </div>
                );
              }
              return null;
            })}
          </React.Fragment>
        ))}
        {showTypingIndicator && (
          <div className={classes.typingIndicator}>
            <span /><span /><span />
          </div>
        )}
        {notices.map((notice, noticeIndex) => (
          <div key={noticeIndex} className={classes.noticeMessage}>{notice}</div>
        ))}
        {chatError && (
          <div className={classes.chatError}>{chatError}</div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className={classes.inputArea}>
        {isListening && interimTranscript && (
          <div className={classes.interimTranscript}>{interimTranscript}</div>
        )}
        <div className={classes.inputRow}>
          <textarea
            ref={textareaRef}
            className={classes.input}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this user, or describe a plan…"
            rows={3}
          />
          <div className={classes.inputButtons}>
            {speechSupported && (
              <button
                type="button"
                className={classNames(classes.micButton, { [classes.micButtonActive]: isListening })}
                title={isListening ? 'Stop dictation' : 'Dictate'}
                onClick={toggleDictation}
              >
                {/* No microphone icon exists in the vendored icon sets */}
                <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" width={18} height={18}>
                  <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z" />
                  <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A7 7 0 0 0 19 11z" />
                </svg>
              </button>
            )}
            <button
              type="button"
              className={classes.sendButton}
              disabled={isLoading || !input.trim()}
              onClick={() => {
                stopDictation();
                void handleSend();
              }}
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default SupermodAgentChatPanel;
