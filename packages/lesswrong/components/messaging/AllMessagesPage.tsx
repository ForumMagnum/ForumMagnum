import React, { useCallback, useMemo, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import stringify from "json-stringify-deterministic";
import classNames from "classnames";
import { conversationGetTitle2 } from "../../lib/collections/conversations/helpers";
import { useDialog } from "../common/withDialog";
import { useLocation, useNavigation } from "../../lib/routeUtil";

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
  column: {
    display: "flex",
    flexDirection: "column",
  },
  leftColumn: {
    // TODO maybe defer this sizing to the underlying component
    width: 341,
    flex: "0 0 341px",
    height: "100%",
  },
  rightColumn: {
    flex: "1 1 auto",
    height: "100%",
  },
  navigation: {
    overflowY: "auto",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderLeft: theme.palette.border.grey200,
    borderRight: theme.palette.border.grey200,
    height: "100%",
  },
  conversation: {
    overflowY: "auto",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    padding: "0px 32px",
    flex: "1 1 auto",
  },
  columnHeader: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    fontSize: 20,
    fontWeight: 600,
    padding: 16,
  },
  columnHeaderLeft: {
    border: theme.palette.border.grey200,
    borderTopLeftRadius: theme.borderRadius.default,
    display: "flex",
    justifyContent: "space-between",
  },
  columnHeaderRight: {
    border: theme.palette.border.grey200,
    borderLeft: "none",
    borderTopRightRadius: theme.borderRadius.default,
  },
  headerText: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
  },
  newMessageIcon: {
    color: theme.palette.grey[600],
    width: 24,
    height: 24,
    cursor: "pointer",
  }
});

const AllMessagesPage = ({ classes }: { classes: ClassesType }) => {
  const currentUser = useCurrentUser();
  const { openDialog } = useDialog();
  const { location, params } = useLocation();
  const { history } = useNavigation();

  const selectedConversationId = params._id;

  // const [selectedConversation, setSelectedConversation] = useState<conversationsListFragment | undefined>();
  const selectedConversationRef = useRef<HTMLDivElement>(null);

  const selectConversationCallback = useCallback((conversationId: string | undefined) => {
    console.log({location})
    
    history.replace({...location, pathname: `/inbox2/${conversationId}`})
  }, [history, location])

  const { InboxNavigation2, ConversationWidget, ForumIcon } = Components;

  const terms: ConversationsViewTerms = { view: "userConversations", userId: currentUser?._id, showArchive: true };
  const conversationsResult: UseMultiResult<"conversationsListFragment"> = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: "conversationsListFragment",
    limit: 500,
    skip: !currentUser,
  });
  const { results: conversations } = conversationsResult;
  const selectedConversation = useMemo(
    () => conversations?.find((c) => c._id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  if (!currentUser) {
    return <div>Log in to access private messages.</div>;
  }

  // Note: we are removing the ability to archive conversations
  // const showArchive = query.showArchive === "true"
  
  {/* <SectionTitle title={title} noTopMargin> */}
    {/* TODO add mod inbox back in */}
    {/* {showModeratorLink && <Link to={"/moderatorInbox"} className={classes.modInboxLink}>Mod Inbox</Link>} */}
  {/* </SectionTitle> */}

  const title = selectedConversation ? conversationGetTitle2(selectedConversation, currentUser) : "No conversation selected";

  return (
    <div className={classes.root}>
      <div className={classNames(classes.column, classes.leftColumn)}>
        <div className={classNames(classes.columnHeader, classes.columnHeaderLeft)}>
          <div className={classes.classes.headerText}>All messages</div>
          <ForumIcon icon="PencilSquare" className={classes.newMessageIcon} />
        </div>
        <div className={classes.navigation}>
          <InboxNavigation2
            conversationsResult={conversationsResult}
            currentUser={currentUser}
            selectedConversationId={selectedConversationId}
            setSelectedConversationId={selectConversationCallback}
          />
        </div>
      </div>
      <div className={classNames(classes.column, classes.rightColumn)}>
        <div className={classNames(classes.columnHeader, classes.columnHeaderRight)}>
          <div className={classes.headerText}>{title}</div>
          {/* TODO triple dot menu */}
        </div>
        <div className={classes.conversation} ref={selectedConversationRef}>
          {selectedConversationId ? (
            <ConversationWidget
              currentUser={currentUser}
              conversationId={selectedConversationId}
              scrollRef={selectedConversationRef}
            />
          ) : (
            <></>
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
