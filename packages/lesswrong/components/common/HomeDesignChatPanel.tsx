'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, DynamicToolUIPart, UIMessage } from 'ai';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useHomeDesignChat } from './HomeDesignChatContext';
import { wrapBodyInSrcdoc } from './SandboxedHomePageSrcdoc';
import classNames from 'classnames';
import CopyToClipboard from 'react-copy-to-clipboard';
import CopyIcon from '@/lib/vendor/@material-ui/icons/src/FileCopy';
import HistoryIcon from '@/lib/vendor/@material-ui/icons/src/History';
import CheckCircleOutlineIcon from '@/lib/vendor/@material-ui/icons/src/CheckCircleOutline';
import KeyboardArrowDownIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@/lib/vendor/@material-ui/icons/src/KeyboardArrowRight';
import { useMessages } from './withMessages';
import PublishDesignDialog from './PublishDesignDialog';
import { gql } from '@/lib/generated/gql-codegen';
import { useQuery } from '@/lib/crud/useQuery';
import { useApolloClient } from '@apollo/client/react';
import moment from 'moment';

const myHomePageDesignSummariesQuery = gql(`
  query MyHomePageDesignSummaries {
    myHomePageDesignSummaries {
      publicId
      title
      createdAt
    }
  }
`);

const homePageDesignByPublicIdFullQuery = gql(`
  query HomePageDesignByPublicIdFull($publicId: String!) {
    homePageDesignByPublicId(publicId: $publicId) {
      _id
      publicId
      html
      title
      source
      conversationHistory
    }
  }
`);

const marketplaceHomePageDesignsQuery = gql(`
  query MarketplaceHomePageDesigns {
    marketplaceHomePageDesigns {
      publicId
      title
      html
      verified
      commentBaseScore
    }
  }
`);

type PanelTab = 'chat' | 'marketplace';

function buildSyntheticDesignMessages(
  userText: string,
  assistantText: string,
  html: string,
  resultPublicId: string | null,
): { messages: UIMessage[]; toolCallId: string } {
  const toolCallId = crypto.randomUUID();
  return {
    toolCallId,
    messages: [
      {
        id: crypto.randomUUID(),
        role: 'user' as const,
        parts: [{ type: 'text' as const, text: userText }],
      },
      {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        parts: [
          { type: 'text' as const, text: assistantText },
          {
            type: 'tool-submitHomePageDesign' as const,
            toolCallId,
            state: 'output-available' as const,
            input: { html },
            output: { publicId: resultPublicId },
          },
        ],
      },
    ],
  };
}

const styles = defineStyles('HomeDesignChatPanel', (theme: ThemeType) => ({
  panel: {
    width: 'clamp(360px, 30vw, 470px)',
    minWidth: 0,
    height: '100%',
    zIndex: 2147483001,
    display: 'flex',
    flexDirection: 'column',
    flexShrink: 0,
    background: '#f8f4ee',
    borderLeft: '1px solid rgba(23, 20, 17, 0.18)',
    boxShadow: 'inset 1px 0 0 rgba(255,255,255,0.35)',
    overflow: 'hidden',
    [theme.breakpoints.down('md')]: {
      width: '100%',
      height: 'min(48dvh, 460px)',
      borderLeft: 'none',
      borderTop: '1px solid rgba(23, 20, 17, 0.18)',
    },
  },
  header: {
    padding: '16px 20px 14px',
    borderBottom: '1px solid rgba(23, 20, 17, 0.18)',
    flexShrink: 0,
  },
  headerKicker: {
    marginBottom: 8,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 9,
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: '#8f1d12',
  },
  headerRow: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    minWidth: 0,
  },
  tabBar: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    padding: '6px 0',
    marginRight: 14,
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: '#85776c',
    '&:hover': {
      color: '#171411',
    },
  },
  tabActive: {
    color: '#171411',
    borderBottomColor: '#8f1d12',
  },
  closeButton: {
    padding: '7px 10px',
    border: '1px solid rgba(23, 20, 17, 0.28)',
    background: 'transparent',
    cursor: 'pointer',
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    color: '#4c433d',
    flexShrink: 0,
    '&:hover': {
      color: '#171411',
      borderColor: 'rgba(23, 20, 17, 0.42)',
    },
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 18px',
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },
  messageCard: {
    paddingTop: 12,
    borderTop: '1px solid rgba(23, 20, 17, 0.12)',
  },
  assistantMessageCard: {
    marginRight: 18,
  },
  userMessageCard: {
    marginLeft: 28,
  },
  messageMeta: {
    marginBottom: 6,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 9,
    letterSpacing: '0.24em',
    textTransform: 'uppercase' as const,
    color: '#85776c',
  },
  userMessageMeta: {
    color: '#5f9b65',
  },
  assistantMessageMeta: {
    color: '#8f1d12',
  },
  message: {
    fontFamily: 'warnock-pro, "Iowan Old Style", Georgia, serif',
    fontSize: 15,
    lineHeight: 1.45,
    color: '#171411',
    whiteSpace: 'pre-wrap',
  },
  typingIndicator: {
    display: 'flex',
    gap: 4,
    padding: '10px 0 0',
    '& span': {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: '#8f1d12',
      animation: '$bounce 1.2s infinite',
    },
    '& span:nth-child(2)': {
      animationDelay: '0.2s',
    },
    '& span:nth-child(3)': {
      animationDelay: '0.4s',
    },
  },
  '@keyframes bounce': {
    '0%, 60%, 100%': { opacity: 0.3 },
    '30%': { opacity: 1 },
  },
  toolApplied: {
    marginTop: 6,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    color: '#5f9b65',
    letterSpacing: '0.16em',
    textTransform: 'uppercase' as const,
    padding: '4px 0',
  },
  publishButton: {
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    padding: '7px 12px',
    background: 'rgba(95, 155, 101, 0.08)',
    color: '#37623b',
    border: '1px solid rgba(95, 155, 101, 0.45)',
    cursor: 'pointer',
    marginTop: 8,
    '&:hover': {
      background: 'rgba(95, 155, 101, 0.14)',
    },
  },
  inputArea: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    alignItems: 'end',
    gap: 10,
    padding: '14px 20px 18px',
    borderTop: '1px solid rgba(23, 20, 17, 0.18)',
    flexShrink: 0,
  },
  inputLabel: {
    gridColumn: '1 / -1',
    marginBottom: -2,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 9,
    letterSpacing: '0.22em',
    textTransform: 'uppercase' as const,
    color: '#85776c',
  },
  input: {
    flex: 1,
    minHeight: 92,
    resize: 'none' as const,
    fontFamily: 'warnock-pro, "Iowan Old Style", Georgia, serif',
    fontSize: 15,
    lineHeight: 1.45,
    padding: '10px 12px',
    border: '1px solid rgba(23, 20, 17, 0.22)',
    outline: 'none',
    color: '#171411',
    background: 'rgba(255,255,255,0.22)',
    '&:focus': {
      border: '1px solid rgba(95, 155, 101, 0.55)',
    },
  },
  sendButton: {
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    padding: '10px 14px',
    background: 'rgba(95, 155, 101, 0.1)',
    color: '#37623b',
    border: '1px solid rgba(95, 155, 101, 0.5)',
    cursor: 'pointer',
    flexShrink: 0,
    '&:hover': {
      background: 'rgba(95, 155, 101, 0.16)',
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'default',
    },
  },
  emptyState: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '22px 0 14px',
    color: '#4c433d',
  },
  emptyKicker: {
    marginBottom: 8,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 9,
    letterSpacing: '0.24em',
    textTransform: 'uppercase' as const,
    color: '#8f1d12',
  },
  emptyTitle: {
    fontFamily: 'ETBookRoman, warnock-pro, "Iowan Old Style", Georgia, serif',
    fontSize: 29,
    lineHeight: 0.98,
    color: '#171411',
    maxWidth: 320,
  },
  emptyCopy: {
    marginTop: 12,
    maxWidth: 340,
    fontFamily: 'warnock-pro, "Iowan Old Style", Georgia, serif',
    fontSize: 15,
    lineHeight: 1.45,
    color: '#4c433d',
  },
  promptExamples: {
    marginTop: 12,
    display: 'grid',
    gap: 6,
    maxWidth: 360,
  },
  promptExample: {
    fontFamily: 'warnock-pro, "Iowan Old Style", Georgia, serif',
    fontSize: 14,
    lineHeight: 1.35,
    color: '#171411',
  },
  byoaLink: {
    marginTop: 16,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    letterSpacing: '0.06em',
    color: '#85776c',
    '& a': {
      color: '#8f1d12',
      textDecoration: 'none',
    },
  },
  copyIcon: {
    fontSize: 12,
    cursor: 'pointer',
    color: '#85776c',
    verticalAlign: 'middle',
    marginLeft: 4,
    '&:hover': {
      color: '#171411',
    },
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
  },
  historyButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    color: theme.palette.icon.dim3,
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  historyIcon: {
    fontSize: 20,
  },
  historyDropdownAnchor: {
    position: 'relative',
  },
  historyDropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: 4,
    width: 300,
    maxHeight: 360,
    overflowY: 'auto',
    background: theme.palette.panelBackground.default,
    border: theme.palette.border.normal,
    borderRadius: 8,
    boxShadow: `0 4px 16px ${theme.palette.boxShadowColor(0.15)}`,
    zIndex: 10,
  },
  historyItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: theme.palette.border.faint,
    '&:last-child': {
      borderBottom: 'none',
    },
    '&:hover': {
      background: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  historyItemActive: {
    background: theme.palette.panelBackground.hoverHighlightGrey,
  },
  itemTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.text.normal,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  historyItemDate: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 11,
    color: theme.palette.text.dim3,
  },
  newConversationItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '10px 14px',
    cursor: 'pointer',
    borderBottom: theme.palette.border.normal,
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    fontWeight: 500,
    color: theme.palette.primary.main,
    '&:hover': {
      background: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  historyEmpty: {
    padding: '16px 14px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim3,
    textAlign: 'center',
  },
  marketplaceList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  marketplaceActions: {
    display: 'grid',
    gap: 8,
    padding: '0 16px 12px',
    borderBottom: theme.palette.border.faint,
  },
  marketplaceActionButton: {
    width: '100%',
    padding: '9px 12px',
    background: 'transparent',
    border: '1px solid rgba(23, 20, 17, 0.2)',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontFamily: '"gill-sans-nova", "Gill Sans", "Helvetica Neue", sans-serif',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: '0.12em',
    textTransform: 'uppercase' as const,
    color: '#4c433d',
    '&:hover': {
      color: '#171411',
      borderColor: 'rgba(23, 20, 17, 0.34)',
      background: 'rgba(255,255,255,0.35)',
    },
  },
  marketplaceItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 16px',
    cursor: 'pointer',
    borderBottom: theme.palette.border.faint,
    '&:hover': {
      background: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  marketplaceItemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
    flex: 1,
  },
  verifiedIcon: {
    fontSize: 16,
    color: theme.palette.primary.main,
    flexShrink: 0,
  },
  karmaScore: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.text.dim3,
    flexShrink: 0,
    marginLeft: 8,
  },
  sectionToggle: {
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    padding: '8px 16px',
    cursor: 'pointer',
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    fontWeight: 500,
    color: theme.palette.text.dim3,
    borderTop: theme.palette.border.faint,
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  sectionToggleIcon: {
    fontSize: 16,
  },
  marketplaceEmpty: {
    padding: '32px 16px',
    fontFamily: theme.typography.fontFamily,
    fontSize: 13,
    color: theme.palette.text.dim3,
    textAlign: 'center',
  },
}));

const HomeDesignChatPanel = () => {
  const classes = useStyles(styles);
  const { isOpen, setIsOpen, applyDesign, useDefaultDesign, setUseDefaultDesign, publicId, setPublicId } = useHomeDesignChat();
  const { flash } = useMessages();
  const client = useApolloClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appliedToolCallIds = useRef(new Set<string>());
  const [input, setInput] = useState('');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<PanelTab>('chat');
  const [showUnverified, setShowUnverified] = useState(false);
  const historyAnchorRef = useRef<HTMLDivElement>(null);

  // Fetch conversation summaries when the panel is open
  const { data: summariesData } = useQuery(myHomePageDesignSummariesQuery, {
    skip: !isOpen,
  });
  const summaries = summariesData?.myHomePageDesignSummaries ?? [];

  // Fetch marketplace designs when the marketplace tab is active
  const { data: marketplaceData } = useQuery(marketplaceHomePageDesignsQuery, {
    skip: !isOpen || activeTab !== 'marketplace',
  });
  const allMarketplaceDesigns = marketplaceData?.marketplaceHomePageDesigns ?? [];
  const verifiedDesigns = allMarketplaceDesigns.filter(d => d.verified);
  const unverifiedDesigns = allMarketplaceDesigns.filter(d => !d.verified);

  // Use a ref so the transport's body function always reads the latest value
  const publicIdRef = useRef<string | null>(publicId);
  publicIdRef.current = publicId;

  const transport = useMemo(() => new DefaultChatTransport({
    api: '/api/homeDesignChat',
    body: () => ({ publicId: publicIdRef.current }),
  }), []);

  const { messages, sendMessage, setMessages, status } = useChat({ transport });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Watch for tool invocations and apply designs
  useEffect(() => {
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
        if (
          part.type === 'tool-submitHomePageDesign' &&
          'state' in part &&
          part.state === 'output-available' &&
          !appliedToolCallIds.current.has(part.toolCallId)
        ) {
          appliedToolCallIds.current.add(part.toolCallId);
          const bodyContent = (part.input as { html: string }).html;
          const origin = window.location.origin;
          applyDesign(wrapBodyInSrcdoc(bodyContent, { origin }));

          // Read publicId from the tool result (set server-side)
          const toolOutput = part.output as { publicId?: string } | undefined;
          if (toolOutput?.publicId) {
            setPublicId(toolOutput.publicId);
          }
        }
      }
    }
  }, [messages, applyDesign, setPublicId]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Close history dropdown on click outside
  useEffect(() => {
    if (!showHistory) return;
    function handleClickOutside(e: MouseEvent) {
      if (historyAnchorRef.current && !historyAnchorRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, [setIsOpen]);

  const handleSubmit = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    void sendMessage({ text: input });
    setInput('');
  }, [input, isLoading, sendMessage]);

  const handleComposerKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      if (!input.trim() || isLoading) return;
      void sendMessage({ text: input });
      setInput('');
    }
  }, [input, isLoading, sendMessage]);

  const handleHistoryItemHover = useCallback((itemPublicId: string) => {
    void client.query({
      query: homePageDesignByPublicIdFullQuery,
      variables: { publicId: itemPublicId },
      fetchPolicy: 'cache-first',
    });
  }, [client]);

  // Load a previous conversation
  const handleLoadConversation = useCallback(async (itemPublicId: string) => {
    const { data } = await client.query({
      query: homePageDesignByPublicIdFullQuery,
      variables: { publicId: itemPublicId },
      fetchPolicy: 'cache-first',
    });
    const design = data?.homePageDesignByPublicId;
    if (!design) return;

    let history = design.conversationHistory as UIMessage[] | null;

    // For external designs, synthesize a conversation so the user can
    // see context and continue chatting from here.
    if (design.source === 'external' && (!history || history.length === 0)) {
      const synthetic = buildSyntheticDesignMessages(
        '[Original prompt sent to external agent]',
        `This design ("${design.title}") was created by an external agent. You can ask me to modify it.`,
        design.html,
        design.publicId,
      );
      appliedToolCallIds.current.add(synthetic.toolCallId);
      history = synthetic.messages;
    }

    setMessages(history ?? []);
    appliedToolCallIds.current.clear();
    setPublicId(design.publicId);
    applyDesign(wrapBodyInSrcdoc(design.html, { origin: window.location.origin }));
    setShowHistory(false);
    setActiveTab('chat');
  }, [client, setMessages, setPublicId, applyDesign]);

  // Start a fresh conversation
  const handleNewConversation = useCallback(() => {
    setMessages([]);
    appliedToolCallIds.current.clear();
    setPublicId(null);
    applyDesign(null);
    setShowHistory(false);
  }, [setMessages, setPublicId, applyDesign]);

  // Apply a marketplace design and switch to chat tab to allow modifications
  const handleApplyMarketplaceDesign = useCallback((design: { publicId: string; title: string; html: string }) => {
    const synthetic = buildSyntheticDesignMessages(
      `[Applied marketplace design: "${design.title}"]`,
      `I've applied the "${design.title}" design from the marketplace. You can ask me to modify it.`,
      design.html,
      null,
    );
    appliedToolCallIds.current.add(synthetic.toolCallId);
    setMessages(synthetic.messages);
    // Don't set publicId — modifications will create a new design under the user's ownership
    setPublicId(null);
    applyDesign(wrapBodyInSrcdoc(design.html, { origin: window.location.origin }));
    setActiveTab('chat');
  }, [setMessages, setPublicId, applyDesign]);

  const handleRevertToBuiltInDefault = useCallback(() => {
    setPublicId(null);
    applyDesign(null);
    setUseDefaultDesign(true);
  }, [setPublicId, applyDesign, setUseDefaultDesign]);

  if (!isOpen) return null;

  const lastAppliedToolCallId = messages
    .flatMap(msg => msg.parts)
    .findLast((part): part is DynamicToolUIPart => part.type === 'tool-submitHomePageDesign' && part.state === 'output-available')?.toolCallId ?? null;

  const lastMsg = messages[messages.length - 1];
  const showTypingIndicator = isLoading && !(lastMsg?.role === 'assistant' && lastMsg.parts.some(
    p => (p.type === 'text' && p.text.trim()) || p.type.startsWith('tool-')
  ));

  return (
    <aside className={classes.panel}>
      <div className={classes.header}>
        <div className={classes.headerRow}>
          <div className={classes.headerText}>
            <div className={classes.tabBar}>
              <button
                className={classNames(classes.tab, { [classes.tabActive]: activeTab === 'chat' })}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              <button
                className={classNames(classes.tab, { [classes.tabActive]: activeTab === 'marketplace' })}
                onClick={() => setActiveTab('marketplace')}
              >
                Marketplace
              </button>
            </div>
          </div>
          <div className={classes.headerActions}>
            <div ref={historyAnchorRef} className={classes.historyDropdownAnchor}>
              <button
                className={classes.historyButton}
                onClick={() => setShowHistory(prev => !prev)}
                title="Conversation history"
              >
                <HistoryIcon className={classes.historyIcon} />
              </button>
              {showHistory && (
                <div className={classes.historyDropdown}>
                  <div className={classes.newConversationItem} onClick={handleNewConversation}>
                    + New conversation
                  </div>
                  {summaries.length === 0 ? (
                    <div className={classes.historyEmpty}>No previous conversations</div>
                  ) : (
                    summaries.map((summary) => (
                      <div
                        key={summary.publicId}
                        className={classNames(classes.historyItem, {
                          [classes.historyItemActive]: summary.publicId === publicId,
                        })}
                        onClick={() => void handleLoadConversation(summary.publicId)}
                        onMouseEnter={() => handleHistoryItemHover(summary.publicId)}
                      >
                        <span className={classes.itemTitle}>{summary.title}</span>
                        <span className={classes.historyItemDate}>
                          {moment(new Date(summary.createdAt)).fromNow()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
            <button className={classes.closeButton} onClick={handleClose}>&times;</button>
          </div>
        </div>
      </div>

      {activeTab === 'chat' && (
        <>
          <div className={classes.messages}>
            {messages.length === 0 && (
              <div className={classes.emptyState}>
                <div className={classes.emptyTitle}>Describe your ideal LessWrong home page.</div>
                <div className={classes.emptyCopy}>
                  Try: "Make it look like Hacker News" or "Newspaper front page layout" or "Dark mode with cards"
                </div>
                <div className={classes.byoaLink}>
                  Or, bring your own agent: give them a link to <a href="/api/homeDesigns/SKILL.md" target="_blank" rel="noopener noreferrer">this skill</a>
                  <CopyToClipboard
                    text={`${window.location.origin}/api/homeDesigns/SKILL.md`}
                    onCopy={() => flash({ messageString: "Skill URL copied!" })}
                  >
                    <CopyIcon className={classes.copyIcon} />
                  </CopyToClipboard>
                  {' '}to get started.
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  if (part.type === 'text' && part.text.trim()) {
                    return (
                      <article
                        key={`${message.id}-${i}`}
                        className={classNames(classes.messageCard, {
                          [classes.userMessageCard]: message.role === 'user',
                          [classes.assistantMessageCard]: message.role === 'assistant',
                        })}
                      >
                        <div className={classes.message}>{part.text}</div>
                      </article>
                    );
                  }
                  if (part.type === 'tool-submitHomePageDesign') {
                    const isApplied = part.state === 'output-available';
                    return (
                      <article
                        key={`${message.id}-${i}`}
                        className={classNames(classes.messageCard, classes.assistantMessageCard)}
                      >
                        <div className={classes.toolApplied}>
                          {isApplied ? 'Design applied.' : 'Applying design...'}
                        </div>
                        {isApplied && publicId && part.toolCallId === lastAppliedToolCallId && (
                          <button
                            className={classes.publishButton}
                            onClick={() => setShowPublishDialog(true)}
                          >
                            Publish to marketplace
                          </button>
                        )}
                      </article>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
            {showTypingIndicator && (
              <div className={classes.typingIndicator}>
                <span /><span /><span />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form className={classes.inputArea} onSubmit={handleSubmit}>
            <textarea
              className={classes.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Describe your home page..."
              disabled={isLoading}
              rows={4}
            />
            <button
              type="submit"
              className={classes.sendButton}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? '...' : 'Send'}
            </button>
          </form>
        </>
      )}

      {activeTab === 'marketplace' && (
        <div className={classes.marketplaceList}>
          <div className={classes.marketplaceActions}>
            <button
              type="button"
              className={classes.marketplaceActionButton}
              onClick={handleRevertToBuiltInDefault}
            >
              {useDefaultDesign ? 'Using built-in default homepage' : 'Revert to built-in default homepage'}
            </button>
          </div>
          {allMarketplaceDesigns.length === 0 ? (
            <div className={classes.marketplaceEmpty}>No published designs yet</div>
          ) : (
            <>
              {verifiedDesigns.map((design) => (
                <div
                  key={design.publicId}
                  className={classes.marketplaceItem}
                  onClick={() => handleApplyMarketplaceDesign(design)}
                >
                  <div className={classes.marketplaceItemLeft}>
                    <CheckCircleOutlineIcon className={classes.verifiedIcon} />
                    <span className={classes.itemTitle}>{design.title}</span>
                  </div>
                  <span className={classes.karmaScore}>{design.commentBaseScore}</span>
                </div>
              ))}
              {unverifiedDesigns.length > 0 && (
                <>
                  <div
                    className={classes.sectionToggle}
                    onClick={() => setShowUnverified(prev => !prev)}
                  >
                    {showUnverified
                      ? <KeyboardArrowDownIcon className={classes.sectionToggleIcon} />
                      : <KeyboardArrowRightIcon className={classes.sectionToggleIcon} />
                    }
                    Unverified ({unverifiedDesigns.length})
                  </div>
                  {showUnverified && unverifiedDesigns.map((design) => (
                    <div
                      key={design.publicId}
                      className={classes.marketplaceItem}
                      onClick={() => handleApplyMarketplaceDesign(design)}
                    >
                      <div className={classes.marketplaceItemLeft}>
                        <span className={classes.itemTitle}>{design.title}</span>
                      </div>
                      <span className={classes.karmaScore}>{design.commentBaseScore}</span>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      )}
      {showPublishDialog && publicId && (
        <PublishDesignDialog
          publicId={publicId}
          onClose={() => setShowPublishDialog(false)}
        />
      )}
    </aside>
  );
};

export default HomeDesignChatPanel;
