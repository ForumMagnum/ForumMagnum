import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen";
import Loading from "../vulcan-core/Loading";
import MessageItem from "./MessageItem";
import { useCurrentUser } from '../common/withUser';

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

const ConversationPreview = ({conversationId, classes, showTitle=true, count=10}: {
  conversationId: string,
  classes: ClassesType<typeof styles>,
  showTitle?: boolean,
  count?: number
}) => {
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

  const messages = dataMessageListFragment?.messages?.results ?? [];
  
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


