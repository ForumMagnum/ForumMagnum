import React from 'react';
import { useMulti } from '../../lib/crud/withMulti';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import { LWTooltip } from "../common/LWTooltip";

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

export const ModeratorMessageCountInner = ({classes, userId}: {
  userId: string,
  classes: ClassesType<typeof styles>,
}) => {
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

export const ModeratorMessageCount = registerComponent('ModeratorMessageCount', ModeratorMessageCountInner, {styles});

declare global {
  interface ComponentTypes {
    ModeratorMessageCount: typeof ModeratorMessageCount
  }
}

