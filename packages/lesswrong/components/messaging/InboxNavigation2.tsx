import React from "react";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useUpdate } from "../../lib/crud/withUpdate";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import { userCanDo } from "../../lib/vulcan-users";
import { preferredHeadingCase } from "../../lib/forumTypeUtils";

const styles = (theme: ThemeType): JssStyles => ({
  title: {
    marginTop: 0,
  },
  modInboxLink: {
    color: theme.palette.lwTertiary.main,
    fontSize: 14,
    fontWeight: 600,
    lineHeight: "24px",
  }
})

// The Navigation for the Inbox components
const InboxNavigation2 = ({
  conversationsResult,
  currentUser,
  title = preferredHeadingCase("All Messages"),
  selectedConversationId,
  setSelectedConversationId,
  classes,
}: {
  conversationsResult: UseMultiResult<"conversationsListFragment">;
  currentUser: UsersCurrent;
  title?: JSX.Element | String;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
  classes: ClassesType;
}) => {
  const location = useLocation();
  const { currentRoute, query } = location;
  const { history } = useNavigation();

  const { results: conversations, loading, loadMoreProps } = conversationsResult;
  const nonEmptyConversations = conversations?.filter((c) => c.messageCount > 0);

  const { mutate: updateConversation } = useUpdate({
    collectionName: "Conversations",
    fragmentName: "conversationsListFragment",
  });

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
      {nonEmptyConversations?.length ? (
        nonEmptyConversations.map((conversation, idx) => (
          <ConversationItem2
            key={conversation._id + idx}
            conversation={conversation}
            updateConversation={updateConversation}
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
