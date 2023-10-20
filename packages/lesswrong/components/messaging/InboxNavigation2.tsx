import React from "react";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useUpdate } from "../../lib/crud/withUpdate";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import { userCanDo } from "../../lib/vulcan-users";
import { preferredHeadingCase } from "../../lib/forumTypeUtils";

const styles = (theme: ThemeType): JssStyles => ({
  root: {}
})

// The Navigation for the Inbox components
const InboxNavigation2 = ({
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
  const { currentRoute } = useLocation();

  const { results: conversations, loading, loadMoreProps } = conversationsResult;

  const {
    ConversationItem2,
    Loading,
    SectionFooter,
    Typography,
    LoadMore,
  } = Components;

  // TODO support
  const showModeratorLink = userCanDo(currentUser, "conversations.view.all") && currentRoute?.name !== "moderatorInbox";

  return <>
      {conversations?.length ? (
        conversations.map((conversation, idx) => (
          <ConversationItem2
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
        <Typography variant="body2">
          You are all done! You have no more open conversations.
        </Typography>
      )}
      <SectionFooter>
        <LoadMore {...loadMoreProps} sectionFooterStyles />
      </SectionFooter>
  </>;
};

const InboxNavigation2Component = registerComponent("InboxNavigation2", InboxNavigation2, {styles});

declare global {
  interface ComponentTypes {
    InboxNavigation2: typeof InboxNavigation2Component;
  }
}
