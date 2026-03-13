import React from "react";
import type { LoadMoreProps } from '../hooks/useQueryWithLoadMore';
import FriendlyConversationItem from "./FriendlyConversationItem";
import Loading from "../vulcan-core/Loading";
import SectionFooter from "../common/SectionFooter";
import { Typography } from "../common/Typography";
import LoadMore from "../common/LoadMore";
import { defineStyles } from '@/components/hooks/defineStyles';
import { useStyles } from '@/components/hooks/useStyles';

const styles = defineStyles("FriendlyInboxNavigation", (theme: ThemeType) => ({
  noConversationsMessage: {
    padding: 16,
  }
}))

// The Navigation for the Inbox components
const FriendlyInboxNavigation = ({conversationsResult, currentUserId, selectedConversationId, setSelectedConversationId}: {
  conversationsResult: {
    results: ConversationsListWithReadStatus[];
    loading: boolean;
    loadMoreProps: LoadMoreProps;
  };
  currentUserId: string;
  title?: React.JSX.Element | string;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const classes = useStyles(styles);
  const { results: conversations, loading, loadMoreProps } = conversationsResult;
  return <>
      {conversations?.length ? (
        conversations.map((conversation, idx) => (
          <FriendlyConversationItem
            key={conversation._id + idx}
            conversation={conversation}
            currentUserId={currentUserId}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={setSelectedConversationId}
          />
        ))
      ) : loading ? (
        <Loading />
      ) : (
        <Typography variant="body2" className={classes.noConversationsMessage}>
          You have no open conversations.
        </Typography>
      )}
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles />
      </SectionFooter>
  </>;
};

export default FriendlyInboxNavigation;


