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
  overlay: {
    position: 'fixed',
    top: 0,
    right: 0,
    bottom: 0,
    width: 420,
    zIndex: 2147483001,
    display: 'flex',
    flexDirection: 'column',
    background: theme.palette.panelBackground.default,
    borderLeft: theme.palette.border.normal,
    boxShadow: `-2px 0 8px ${theme.palette.boxShadowColor(0.1)}`,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 16px',
    borderBottom: theme.palette.border.normal,
    flexShrink: 0,
  },
  tabBar: {
    display: 'flex',
  },
  tab: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    fontWeight: 500,
    padding: '6px 14px',
    background: 'none',
    border: 'none',
    borderBottom: '2px solid transparent',
    cursor: 'pointer',
    color: theme.palette.text.dim3,
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  tabActive: {
    color: theme.palette.text.normal,
    borderBottomColor: theme.palette.primary.main,
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: 20,
    color: theme.palette.icon.dim3,
    padding: 4,
    '&:hover': {
      color: theme.palette.text.normal,
    },
  },
  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  message: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    lineHeight: 1.5,
    color: theme.palette.text.normal,
    whiteSpace: 'pre-wrap',
  },
  userMessage: {
    background: theme.palette.panelBackground.hoverHighlightGrey,
    borderRadius: 8,
    padding: '8px 12px',
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  typingIndicator: {
    alignSelf: 'flex-start',
    display: 'flex',
    gap: 4,
    padding: '8px 12px',
    '& span': {
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: theme.palette.primary.main,
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
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    color: theme.palette.primary.main,
    fontStyle: 'italic',
    padding: '4px 0',
  },
  publishButton: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 12,
    padding: '4px 12px',
    background: 'none',
    color: theme.palette.primary.main,
    border: theme.palette.border.normal,
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 4,
    '&:hover': {
      background: theme.palette.panelBackground.hoverHighlightGrey,
    },
  },
  inputArea: {
    display: 'flex',
    padding: '12px 16px',
    borderTop: theme.palette.border.normal,
    gap: 8,
    flexShrink: 0,
  },
  input: {
    flex: 1,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    padding: '8px 12px',
    border: theme.palette.border.normal,
    borderRadius: 4,
    outline: 'none',
    color: theme.palette.text.normal,
    background: theme.palette.panelBackground.default,
    '&:focus': {
      border: `1px solid ${theme.palette.primary.main}`,
    },
  },
  sendButton: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    padding: '8px 16px',
    background: theme.palette.primary.main,
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    flexShrink: 0,
    '&:hover': {
      background: '#4e8a54',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    color: theme.palette.text.dim3,
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 1.6,
  },
  byoaLink: {
    marginTop: 16,
    fontSize: 12,
    color: theme.palette.text.dim3,
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
  },
  copyIcon: {
    fontSize: 12,
    cursor: 'pointer',
    color: theme.palette.text.dim3,
    verticalAlign: 'middle',
    marginLeft: 4,
    '&:hover': {
      color: theme.palette.text.normal,
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
  const { isOpen, setIsOpen, applyDesign, publicId, setPublicId } = useHomeDesignChat();
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

  // Prefetch full design data on hover
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

  if (!isOpen) return null;

  const lastAppliedToolCallId = messages
    .flatMap(msg => msg.parts)
    .findLast((part): part is DynamicToolUIPart => part.type === 'tool-submitHomePageDesign' && part.state === 'output-available')?.toolCallId ?? null;

  const lastMsg = messages[messages.length - 1];
  const showTypingIndicator = isLoading && !(lastMsg?.role === 'assistant' && lastMsg.parts.some(
    p => (p.type === 'text' && p.text.trim()) || p.type.startsWith('tool-')
  ));

  return (
    <div className={classes.overlay}>
      <div className={classes.header}>
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

      {activeTab === 'chat' && (
        <>
          <div className={classes.messages}>
            {messages.length === 0 && (
              <div className={classes.emptyState}>
                Describe your ideal LessWrong home page.
                <br /><br />
                Try: &quot;Make it look like Hacker News&quot; or &quot;Newspaper front page layout&quot; or &quot;Dark mode with cards&quot;
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
                      <div
                        key={`${message.id}-${i}`}
                        className={classNames(classes.message, {
                          [classes.userMessage]: message.role === 'user',
                          [classes.assistantMessage]: message.role === 'assistant',
                        })}
                      >
                        {part.text}
                      </div>
                    );
                  }
                  if (part.type === 'tool-submitHomePageDesign') {
                    const isApplied = part.state === 'output-available';
                    return (
                      <div key={`${message.id}-${i}`}>
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
                      </div>
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
            <input
              className={classes.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe your home page..."
              disabled={isLoading}
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
    </div>
  );
};

export default HomeDesignChatPanel;
