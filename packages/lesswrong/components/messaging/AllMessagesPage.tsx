import React, { useMemo, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { useMulti } from "../../lib/crud/withMulti";
import stringify from "json-stringify-deterministic";

const MAX_WIDTH = 1050;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "row",
    width: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "32px 32px 0px 32px",
    position: "relative",
    zIndex: theme.zIndexes.singleColumnSection,
  },
  navigation: {
    // TODO maybe defer this sizing to the underlying component
    width: 341,
    flex: "0 0 341px",
    height: "100%",
    overflowY: "auto",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
  },
  conversation: {
    flex: "1 1 auto",
    height: "100%",
    overflowY: "auto",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    // TODO decide whether to have this padding or not
    // paddingRight: 12,
  },
  selectedConversation: {
    padding: "0px 32px",
  },
  columnHeader: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
    borderTop: theme.palette.border.grey200,
    borderLeft: theme.palette.border.grey200,
    borderRight: theme.palette.border.grey200,
  },
});

const AllMessagesPage = ({ classes }: { classes: ClassesType }) => {
  const currentUser = useCurrentUser();
  const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
  const selectedConversationRef = useRef<HTMLDivElement>(null);

  const { InboxNavigation2, ConversationWidget } = Components;

  const terms: ConversationsViewTerms = { view: "userConversations", userId: currentUser?._id, showArchive: true };
  const { results, loading, loadMoreProps } = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: "conversationsListFragment",
    limit: 50,
    skip: !currentUser,
  });

  const resultsSignature = stringify(results);
  const conversationsMap = useMemo(
    () =>
      (results ?? []).reduce((map, conversation) => {
        map[conversation._id] = conversation;
        return map;
      }, {} as Record<string, conversationsListFragment>),
    [results]
  );

  if (!currentUser) {
    return <div>Log in to access private messages.</div>;
  }

  // Note: we are removing the ability to archive conversations
  // const showArchive = query.showArchive === "true"

  return (
    <div className={classes.root}>
      <div className={classes.navigation}>
        <div className={classes.columnHeader}>All messages</div>
        <InboxNavigation2
          terms={terms}
          currentUser={currentUser}
          selectedConversationId={selectedConversationId}
          setSelectedConversationId={setSelectedConversationId}
        />
      </div>
      <div className={classes.conversation} ref={selectedConversationRef}>
        <div className={classes.columnHeader}>No conversation selected</div>
        <div className={classes.selectedConversation}>
          {selectedConversationId ? (
            <ConversationWidget
              currentUser={currentUser}
              conversationId={selectedConversationId}
              scrollRef={selectedConversationRef}
            />
          ) : (
            <div>Select a conversation to view</div>
          )}
        </div>
      </div>
    </div>
  );
};

const AllMessagesPageComponent = registerComponent("AllMessagesPage", AllMessagesPage, { styles });

declare global {
  interface ComponentTypes {
    AllMessagesPage: typeof AllMessagesPageComponent;
  }
}
