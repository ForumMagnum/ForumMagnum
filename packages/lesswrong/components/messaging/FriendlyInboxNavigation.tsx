import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { UseMultiResult } from "../../lib/crud/withMulti";

const styles = (theme: ThemeType): JssStyles => ({
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
  conversationsResult: UseMultiResult<"ConversationsList">;
  currentUser: UsersCurrent;
  title?: JSX.Element | String;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  classes: ClassesType;
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

const FriendlyInboxNavigationComponent = registerComponent("FriendlyInboxNavigation", FriendlyInboxNavigation, {styles});

declare global {
  interface ComponentTypes {
    FriendlyInboxNavigation: typeof FriendlyInboxNavigationComponent;
  }
}
