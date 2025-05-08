import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { UseMultiResult } from "../../lib/crud/withMulti";

const styles = (theme: ThemeType) => ({
  noConversationsMessage: {
    padding: 16,
  }
})

// The Navigation for the Inbox components
const FriendlyInboxNavigationInner = ({
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

  const {
    FriendlyConversationItem,
    Loading,
    SectionFooter,
    Typography,
    LoadMore,
  } = Components;

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

export const FriendlyInboxNavigation = registerComponent("FriendlyInboxNavigation", FriendlyInboxNavigationInner, {styles});

declare global {
  interface ComponentTypes {
    FriendlyInboxNavigation: typeof FriendlyInboxNavigation;
  }
}
