import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { UseMultiResult } from "../../lib/crud/withMulti";
import FriendlyConversationItem from "@/components/messaging/FriendlyConversationItem";
import { Loading } from "@/components/vulcan-core/Loading";
import SectionFooter from "@/components/common/SectionFooter";
import { Typography } from "@/components/common/Typography";
import LoadMore from "@/components/common/LoadMore";

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
  conversationsResult: UseMultiResult<"ConversationsListWithReadStatus">;
  currentUser: UsersCurrent;
  title?: JSX.Element | String;
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

const FriendlyInboxNavigationComponent = registerComponent("FriendlyInboxNavigation", FriendlyInboxNavigation, {styles});

declare global {
  interface ComponentTypes {
    FriendlyInboxNavigation: typeof FriendlyInboxNavigationComponent;
  }
}

export default FriendlyInboxNavigationComponent;
