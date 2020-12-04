import React from 'react';
import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import Messages from "../../lib/collections/messages/collection";
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { Link } from '../../lib/reactRouterWrapper';

const styles = (theme: ThemeType): JssStyles => ({
  conversationSection: {
    maxWidth: 550,
  },
  conversationTitle: {
    ...theme.typography.commentStyle,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*1.5
  },
  editor: {
    marginTop: theme.spacing.unit*4,
    ...theme.typography.commentStyle,
    position:"relative",
  },
  backButton: {
    color: theme.palette.lwTertiary.main
  }
})

// The Navigation for the Inbox components
const ConversationPage = ({ documentId, terms, currentUser, classes }: {
  documentId: string,
  terms: MessagesViewTerms,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  const { results, loading: loadingMessages } = useMulti({
    terms,
    collectionName: "Messages",
    fragmentName: 'messageListFragment',
    fetchPolicy: 'cache-and-network',
    limit: 1000,
    enableTotal: false,
  });
  const { document: conversation, loading: loadingConversation } = useSingle({
    documentId,
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
  });
  const loading = loadingMessages || loadingConversation;
  
  const { SingleColumnSection, ConversationDetails, WrappedSmartForm, Error404, Loading, MessageItem, Typography } = Components
  
  const renderMessages = () => {
    if (loading) return <Loading />
    if (!results?.length) return null
    
    return <div>
      {results.map((message) => (<MessageItem key={message._id} message={message} />))}
    </div>
  }

  if (loading) return <Loading />
  if (!conversation) return <Error404 />

  return (
    <SingleColumnSection>
      <div className={classes.conversationSection}>
        <Typography variant="body2" className={classes.backButton}><Link to="/inbox"> Go back to Inbox </Link></Typography>
        <Typography variant="display2" className={classes.conversationTitle}>
          { conversationGetTitle(conversation, currentUser)}
        </Typography>
        <ConversationDetails conversation={conversation}/>
        {renderMessages()}
        <div className={classes.editor}>
          <WrappedSmartForm
            collection={Messages}
            prefilledProps={ {conversationId: conversation._id} }
            mutationFragment={getFragment("messageListFragment")}
            errorCallback={(message: any) => {
              //eslint-disable-next-line no-console
              console.error("Failed to send", message)
            }}
          />
        </div>
      </div>
    </SingleColumnSection>
  )
}

const ConversationPageComponent = registerComponent('ConversationPage', ConversationPage, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ConversationPage: typeof ConversationPageComponent
  }
}

