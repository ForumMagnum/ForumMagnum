import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useMulti } from '../../lib/crud/withMulti';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import { useQuery } from "@apollo/client";
import { gql } from "@/lib/generated/gql-codegen/gql";
import Loading from "../vulcan-core/Loading";
import MessageItem from "./MessageItem";
import type { UsersCurrent } from '@/lib/generated/gql-codegen/graphql';

const ConversationsListQuery = gql(`
  query ConversationPreview($documentId: String) {
    conversation(input: { selector: { documentId: $documentId } }) {
      result {
        ...ConversationsList
      }
    }
  }
`);

const styles = (theme: ThemeType) => ({
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
})

const ConversationPreview = ({conversationId, currentUser, classes, showTitle=true, count=10}: {
  conversationId: string,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
  showTitle?: boolean,
  count?: number
}) => {
  const { loading: conversationLoading, data } = useQuery(ConversationsListQuery, {
    variables: { documentId: conversationId },
    fetchPolicy: 'cache-then-network' as any,
  });
  const conversation = data?.conversation?.result;

  const { results: messages = [] } = useMulti({
    terms: {
      view: 'conversationPreview', 
      conversationId: conversationId
    },
    collectionName: "Messages",
    fragmentName: 'messageListFragment',
    fetchPolicy: 'cache-and-network',
    limit: count,
  });
  
  // using a spread operator instead of naively "messages.reverse()" to avoid modifying the 
  // original array, which coud cause rendering bugs (reversing the order every time the component re-renders)
  const reversedMessages = [...messages].reverse()

  return <div className={classes.root}>
    { conversation && showTitle && <div className={classes.title}>{ conversationGetTitle(conversation, currentUser) }</div>}
    { conversationLoading && <Loading />}
    
    { conversation && reversedMessages.map((message) => (<MessageItem key={message._id} message={message} />))}
  </div>
}

export default registerComponent('ConversationPreview', ConversationPreview, {styles});


