import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import EmailIcon from '@material-ui/icons/Email';

const styles = (theme: ThemeType) => ({
  root: {
    ...theme.typography.body2,
    color: theme.palette.grey[600],
    cursor: "pointer",
    position: "relative",
    top: 2
  },
  icon: {
    height: 13,
    position: "relative",
    top: 1
  }
});

export const ModeratorMessageCount = ({classes, userId}: {
  userId: string,
  classes: ClassesType<typeof styles>,
}) => {
  const { LWTooltip } = Components
  const { loading, totalCount } = useMulti({
    terms: {view: "moderatorConversations", userId},
    collectionName: "Conversations",
    fragmentName: 'ConversationsMinimumInfo',
    fetchPolicy: 'cache-and-network',
    enableTotal: true
  });

  if (totalCount === 0 || loading) return null

  return <LWTooltip title={`Moderator Conversation Count`}>
    <Link className={classes.root} to={`/moderatorInbox?userId=${userId}`}>
      {totalCount} <EmailIcon className={classes.icon}/>
    </Link>
  </LWTooltip>
}

const ModeratorMessageCountComponent = registerComponent('ModeratorMessageCount', ModeratorMessageCount, {styles});

declare global {
  interface ComponentTypes {
    ModeratorMessageCount: typeof ModeratorMessageCountComponent
  }
}

