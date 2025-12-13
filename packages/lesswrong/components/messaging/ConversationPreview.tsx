import React from 'react';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import MessageItem from "./MessageItem";
import { useCurrentUser } from '../common/withUser';
import { defineStyles, useStyles } from '../hooks/useStyles';

const messageListFragmentMultiQuery = gql(`
  query multiMessageConversationPreviewQuery($selector: MessageSelector, $limit: Int, $enableTotal: Boolean) {
    messages(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...messageListFragment
      }
      totalCount
    }
  }
`);

const singleMessagePreviewQuery = gql(`
  query singleMessageConversationPreviewQuery($documentId: String) {
    message(selector: { documentId: $documentId }) {
      result {
        ...messageListFragment
      }
    }
  }
`);

const ConversationsListQuery = gql(`
  query ConversationPreview($documentId: String) {
    conversation(input: { selector: { documentId: $documentId } }) {
      result {
        ...ConversationsList
      }
    }
  }
`);

const styles = defineStyles("ConversationPreview", (theme: ThemeType) => ({
  root: {
    padding: theme.spacing.unit,
    maxWidth: 700,
    [theme.breakpoints.down('xs')]: {
      display: "none"
    },
  },
  title: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    marginBottom: theme.spacing.unit
  }
}))

/**
 * Hover preview for a conversation, optionally taking the ID of a message within that conversation.
 * The most recent `count` messages will be loaded; if a message is not specified or the message
 * specified is one of those messages, recent messages will be shown in reverse order with the
 * specified message highlighted. If the specified message _isn't_ in the recent messages window,
 * only that message will be shown.
 */
const ConversationPreview = ({conversationId, messageId, showTitle=true, count=10, showFullWidth}: {
  conversationId: string,
  messageId?: string,
  showTitle?: boolean,
  count?: number,
  showFullWidth?: boolean,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser()!;
  const { loading: conversationLoading, data } = useQuery(ConversationsListQuery, {
    variables: { documentId: conversationId },
    fetchPolicy: 'cache-first',
  });
  const conversation = data?.conversation?.result;

  const { data: dataMessageListFragment } = useQuery(messageListFragmentMultiQuery, {
    variables: {
      selector: { conversationPreview: { conversationId: conversationId } },
      limit: count,
      enableTotal: false,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });

  const { data: dataSingleMessage, loading: singleMessageLoading } = useQuery(singleMessagePreviewQuery, {
    variables: { documentId: messageId },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
    skip: !messageId,
  });

  const singleMessage = dataSingleMessage?.message?.result;

  const messages: messageListFragment[] = dataMessageListFragment?.messages?.results ?? [];
  const singleMessageIsInWindow = messageId && singleMessage && conversation && messages?.some(message => message._id === messageId);

  
  // using a spread operator instead of naively "messages.reverse()" to avoid modifying the 
  // original array, which coud cause rendering bugs (reversing the order every time the component re-renders)
  const reversedMessages = [...messages].reverse()

  const loading = (conversationLoading && !conversation) || (messageId && singleMessageLoading && !singleMessage);

  return <div className={classes.root}>
    { conversation && showTitle && <div className={classes.title}>{ conversationGetTitle(conversation, currentUser) }</div>}
    { loading && <Loading />}
    
    { !loading && (
      ((singleMessage && (!singleMessageIsInWindow || count === 1)))
        ? <MessageItem message={singleMessage} showFullWidth />
        : reversedMessages.map((message) =>
            <MessageItem
              key={message._id}
              highlight={message._id === messageId}
              message={message}
              showFullWidth={showFullWidth || count === 1}
            />
          )
      )
    }
  </div>
}

export default ConversationPreview;

