import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { useSingle } from '../../lib/crud/withSingle';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';

const styles = (theme: ThemeType) => ({
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
    position:"relative",
  },
  backButton: {
    color: theme.palette.lwTertiary.main
  },
  row: {
    display: "flex",
    justifyContent: "space-between"
  }
})

/**
 * Page for viewing a private messages conversation. Typically invoked from
 * ConversationWrapper, which takes care of the URL parsing.
 */
const ConversationPageInner = ({ conversationId, currentUser, classes }: {
  conversationId: string,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const { document: conversation, loading } = useSingle({
    documentId: conversationId,
    collectionName: "Conversations",
    fragmentName: 'ConversationsList',
  });

  const { SingleColumnSection, ConversationContents, Error404, Loading, Typography, ConversationDetails } = Components

  if (loading) return <Loading />
  if (!conversation) return <Error404 />

  const showModInboxLink = userCanDo(currentUser, 'conversations.view.all') && conversation.moderator

  return (
    <SingleColumnSection>
      <div className={classes.conversationSection}>
        <div className={classes.row}>
          <Typography variant="body2" className={classes.backButton}><Link to="/inbox"> Go back to Inbox </Link></Typography>
          {showModInboxLink && <Typography variant="body2" className={classes.backButton}>
            <Link to="/moderatorInbox"> Moderator Inbox </Link>
          </Typography>}
        </div>
        <Typography variant="display2" className={classes.conversationTitle}>
          {conversationGetTitle(conversation, currentUser)}
        </Typography>
        <ConversationDetails conversation={conversation} />
        <ConversationContents
          conversation={conversation}
          currentUser={currentUser}
        />
      </div>
    </SingleColumnSection>
  )
}

export const ConversationPage = registerComponent('ConversationPage', ConversationPageInner, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ConversationPage: typeof ConversationPage
  }
}

