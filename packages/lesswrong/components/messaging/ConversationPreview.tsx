import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import Loading from "../vulcan-core/Loading";
import MessageItem from "./MessageItem";

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
  const { document: conversation, loading: conversationLoading } = useSingle({
    collectionName: "Conversations",
    fragmentName: 'ConversationsList',
    fetchPolicy: 'cache-first',
    documentId: conversationId
  });

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


