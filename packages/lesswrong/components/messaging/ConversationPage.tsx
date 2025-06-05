import React from 'react';
import { registerComponent } from '../../lib/vulcan-lib/components';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { Link } from '../../lib/reactRouterWrapper';
import { userCanDo } from '../../lib/vulcan-users/permissions';
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/generated/gql-codegen/gql";
import SingleColumnSection from "../common/SingleColumnSection";
import ConversationContents from "./ConversationContents";
import Error404 from "../common/Error404";
import Loading from "../vulcan-core/Loading";
import { Typography } from "../common/Typography";
import ConversationDetails from "./ConversationDetails";


const ConversationsListQuery = gql(`
  query ConversationPage($documentId: String) {
    conversation(input: { selector: { documentId: $documentId } }) {
      result {
        ...ConversationsList
      }
    }
  }
`);

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
const ConversationPage = ({ conversationId, currentUser, classes }: {
  conversationId: string,
  currentUser: UsersCurrent,
  classes: ClassesType<typeof styles>,
}) => {
  const { loading, data } = useQuery(ConversationsListQuery, {
    variables: { documentId: conversationId },
  });
  const conversation = data?.conversation?.result;

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

export default registerComponent('ConversationPage', ConversationPage, {
  styles,
  hocs: [withErrorBoundary]
});



