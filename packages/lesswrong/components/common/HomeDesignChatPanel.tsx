'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { defineStyles, useStyles } from '../hooks/useStyles';
import { useHomeDesignChat } from './HomeDesignChatContext';
import { wrapBodyInSrcdoc } from './SandboxedHomePageSrcdoc';
import classNames from 'classnames';

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
    boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: theme.palette.border.normal,
    flexShrink: 0,
  },
  headerTitle: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 16,
    fontWeight: 500,
    color: theme.palette.text.normal,
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
      background: '#5f9b65',
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
    color: '#5f9b65',
    fontStyle: 'italic',
    padding: '4px 0',
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
      border: '1px solid #5f9b65',
    },
  },
  sendButton: {
    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    padding: '8px 16px',
    background: '#5f9b65',
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
    textAlign: 'center' as const,
    lineHeight: 1.6,
  },
}));

const transport = new DefaultChatTransport({
  api: '/api/homeDesignChat',
});

const HomeDesignChatPanel = () => {
  const classes = useStyles(styles);
  const designChat = useHomeDesignChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const appliedToolCallIds = useRef(new Set<string>());
  const [input, setInput] = useState('');

  const { messages, sendMessage, status } = useChat({ transport });

  const isLoading = status === 'streaming' || status === 'submitted';

  // Watch for tool invocations and apply designs
  const applyDesign = designChat?.applyDesign;
  useEffect(() => {
    if (!applyDesign) return;
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
        }
      }
    }
  }, [messages, applyDesign]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClose = useCallback(() => {
    designChat?.setIsOpen(false);
  }, [designChat]);

  const handleSubmit = useCallback((e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    void sendMessage({ text: input });
    setInput('');
  }, [input, isLoading, sendMessage]);

  if (!designChat?.isOpen) return null;

  return (
    <div className={classes.overlay}>
      <div className={classes.header}>
        <span className={classes.headerTitle}>Customize Home Page</span>
        <button className={classes.closeButton} onClick={handleClose}>&times;</button>
      </div>

      <div className={classes.messages}>
        {messages.length === 0 && (
          <div className={classes.emptyState}>
            Describe your ideal LessWrong home page.
            <br /><br />
            Try: "Make it look like Hacker News" or "Newspaper front page layout" or "Dark mode with cards"
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
                return (
                  <div key={`${message.id}-${i}`} className={classes.toolApplied}>
                    {part.state === 'output-available' ? 'Design applied.' : 'Applying design...'}
                  </div>
                );
              }
              return null;
            })}
          </div>
        ))}
        {isLoading && (() => {
          const lastMsg = messages[messages.length - 1];
          const hasVisibleContent = lastMsg && lastMsg.role === 'assistant' && lastMsg.parts.some(
            p => (p.type === 'text' && p.text.trim()) || p.type.startsWith('tool-')
          );
          return !hasVisibleContent;
        })() && (
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
    </div>
  );
};

export default HomeDesignChatPanel;
