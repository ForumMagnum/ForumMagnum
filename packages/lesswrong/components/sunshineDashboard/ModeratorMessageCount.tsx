import React from 'react';
import { Link } from '../../lib/reactRouterWrapper';
import { registerComponent } from '../../lib/vulcan-lib/components';
import EmailIcon from '@/lib/vendor/@material-ui/icons/src/Email';
import LWTooltip from "../common/LWTooltip";
import { useQuery } from "@/lib/crud/useQuery";
import { gql } from "@/lib/crud/wrapGql";

const ConversationsMinimumInfoMultiQuery = gql(`
  query multiConversationModeratorMessageCountQuery($selector: ConversationSelector, $limit: Int, $enableTotal: Boolean) {
    conversations(selector: $selector, limit: $limit, enableTotal: $enableTotal) {
      results {
        ...ConversationsMinimumInfo
      }
      totalCount
    }
  }
`);

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
  const { data, loading } = useQuery(ConversationsMinimumInfoMultiQuery, {
    variables: {
      selector: { moderatorConversations: { userId } },
      limit: 10,
      enableTotal: true,
    },
    fetchPolicy: 'cache-and-network',
    notifyOnNetworkStatusChange: true,
  });
  const totalCount = data?.conversations?.totalCount;

  if (totalCount === 0 || loading) return null

  return <LWTooltip title={`Moderator Conversation Count`}>
    <Link className={classes.root} to={`/moderatorInbox?userId=${userId}`}>
      {totalCount} <EmailIcon className={classes.icon}/>
    </Link>
  </LWTooltip>
}

export default registerComponent('ModeratorMessageCount', ModeratorMessageCount, {styles});



