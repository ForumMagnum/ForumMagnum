'use client';

import React, { useState } from 'react';
import { useLazyQuery } from '@apollo/client/react';
import { UIMessage } from 'ai';
import { defineStyles, useStyles } from '@/components/hooks/useStyles';
import { useQuery } from '@/lib/crud/useQuery';
import { gql } from '@/lib/generated/gql-codegen';
import { useMessages } from '@/components/common/withMessages';
import FormatDate from '@/components/common/FormatDate';

const ConversationsForTargetQuery = gql(`
  query multiModerationAgentConversationsForTargetQuery($selector: ModerationAgentConversationSelector, $limit: Int) {
    moderationAgentConversations(selector: $selector, limit: $limit) {
      results {
        _id
        createdAt
        title
        userId
        user {
          _id
          displayName
        }
      }
    }
  }
`);

const ConversationMessagesQuery = gql(`
  query ModerationAgentConversationMessagesQuery($conversationId: String) {
    moderationAgentConversation(selector: { _id: $conversationId }) {
      result {
        _id
        messages
      }
    }
  }
`);

const styles = defineStyles('SupermodAgentChatHistory', (theme: ThemeType) => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginTop: 16,
  },
  heading: {
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: theme.palette.grey[600],
    marginBottom: 4,
  },
  row: {
    display: 'flex',
    alignItems: 'baseline',
    gap: 8,
    width: '100%',
    padding: '5px 8px',
    fontSize: 13,
    fontFamily: 'inherit',
    textAlign: 'left',
    border: 'none',
    borderRadius: 6,
    background: 'none',
    cursor: 'pointer',
    color: theme.palette.text.normal,
    '&:hover': {
      backgroundColor: theme.palette.grey[100],
    },
    '&:disabled': {
      opacity: 0.6,
      cursor: 'default',
    },
  },
  title: {
    flex: 1,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  meta: {
    flexShrink: 0,
    fontSize: 11.5,
    color: theme.palette.grey[600],
  },
}));

/**
 * Prior agent conversations about the opened user, shown in the chat panel's
 * empty state. Conversations are shared between moderators (any moderator's
 * chats about this user appear), so each row names its moderator. Clicking a
 * row loads that conversation's transcript into the panel.
 */
const SupermodAgentChatHistory = ({ targetUserId, currentUserId, onSelect }: {
  targetUserId: string;
  currentUserId: string;
  onSelect: (conversation: { _id: string; userId: string | null }, messages: UIMessage[]) => void;
}) => {
  const classes = useStyles(styles);
  const { flash } = useMessages();
  const [loadingConversationId, setLoadingConversationId] = useState<string | null>(null);

  const { data } = useQuery(ConversationsForTargetQuery, {
    variables: {
      selector: { conversationsForTarget: { targetUserId } },
      limit: 20,
    },
    fetchPolicy: 'cache-and-network',
    ssr: false,
  });

  const [fetchMessages] = useLazyQuery(ConversationMessagesQuery, { fetchPolicy: 'network-only' });

  // Conversations abandoned before the first exchange have no messages to
  // load; the title is only generated after the first exchange, so
  // title-less rows are those empty shells and get filtered out.
  const conversations = (data?.moderationAgentConversations?.results ?? []).filter(
    (conversation) => conversation.title,
  );
  if (!conversations.length) return null;

  const handleSelect = async (conversation: { _id: string; userId: string | null }) => {
    if (loadingConversationId) return;
    setLoadingConversationId(conversation._id);
    try {
      const { data: messagesData } = await fetchMessages({ variables: { conversationId: conversation._id } });
      const messages = (messagesData?.moderationAgentConversation?.result?.messages ?? []) as UIMessage[];
      onSelect(conversation, messages);
    } catch {
      flash({ messageString: 'Failed to load conversation' });
    } finally {
      setLoadingConversationId(null);
    }
  };

  return (
    <div className={classes.root}>
      <div className={classes.heading}>Prior chats about this user</div>
      {conversations.map((conversation) => (
        <button
          key={conversation._id}
          type="button"
          className={classes.row}
          disabled={!!loadingConversationId}
          onClick={() => void handleSelect(conversation)}
        >
          <span className={classes.title}>
            {loadingConversationId === conversation._id ? 'Loading…' : conversation.title}
          </span>
          <span className={classes.meta}>
            {conversation.userId === currentUserId ? 'you' : conversation.user?.displayName}
            {' · '}
            <FormatDate date={conversation.createdAt} tooltip={false} />
          </span>
        </button>
      ))}
    </div>
  );
};

export default SupermodAgentChatHistory;
