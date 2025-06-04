import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import type { LoadMoreProps } from '../hooks/useQueryWithLoadMore';
import FriendlyConversationItem from "./FriendlyConversationItem";
import Loading from "../vulcan-core/Loading";
import SectionFooter from "../common/SectionFooter";
import { Typography } from "../common/Typography";
import LoadMore from "../common/LoadMore";

const styles = (theme: ThemeType) => ({
  noConversationsMessage: {
    padding: 16,
  }
})

// The Navigation for the Inbox components
const FriendlyInboxNavigation = ({
  conversationsResult,
  currentUser,
  selectedConversationId,
  setSelectedConversationId,
  classes,
}: {
  conversationsResult: {
    results: ConversationsListWithReadStatus[];
    loading: boolean;
    loadMoreProps: LoadMoreProps;
  };
  currentUser: UsersCurrent;
  title?: React.JSX.Element | string;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  classes: ClassesType<typeof styles>;
}) => {
  const { results: conversations, loading, loadMoreProps } = conversationsResult;
  return <>
      {conversations?.length ? (
        conversations.map((conversation, idx) => (
          <FriendlyConversationItem
            key={conversation._id + idx}
            conversation={conversation}
            currentUser={currentUser}
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

export default registerComponent("FriendlyInboxNavigation", FriendlyInboxNavigation, {styles});


