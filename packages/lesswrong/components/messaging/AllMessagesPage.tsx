import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { useCurrentUser } from "../common/withUser";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import classNames from "classnames";
import { conversationGetTitle2 } from "../../lib/collections/conversations/helpers";
import { useDialog } from "../common/withDialog";
import { useLocation, useNavigation } from "../../lib/routeUtil";
import type { InboxComponentProps } from "./InboxWrapper";
import { useSingle } from "../../lib/crud/withSingle";

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
    borderRight: theme.palette.border.grey200,
    padding: "0px 32px",
    flex: "1 1 auto",
  },
  columnHeader: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    border: theme.palette.border.grey200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    fontSize: 20,
    fontWeight: 600,
    padding: 16,
  },
  columnHeaderLeft: {
    borderTopLeftRadius: theme.borderRadius.default,
  },
  columnHeaderRight: {
    borderLeft: "none",
    borderTopRightRadius: theme.borderRadius.default,
  },
  headerText: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
  },
  actionIcon: {
    color: theme.palette.grey[600],
    width: 24,
    height: 24,
    cursor: "pointer",
  }
});

const AllMessagesPage = ({
  currentUser,
  terms,
  conversationId,
  classes,
}: InboxComponentProps & {
  conversationId?: string;
}) => {
  const { openDialog } = useDialog();
  const { location } = useLocation();
  const { history } = useNavigation();

  const selectedConversationRef = useRef<HTMLDivElement>(null);

  const selectConversationCallback = useCallback(
    (conversationId: string | undefined) => {
      history.replace({ ...location, pathname: `/inbox/${conversationId}` });
    },
    [history, location]
  );

  const openNewConversationDialog = useCallback(() => {
    openDialog({
      componentName: "NewConversationDialog",
      componentProps: {},
    });
  }, [openDialog]);

  const { InboxNavigation2, ConversationWidget, ForumIcon, ConversationDetails } = Components;

  const conversationsResult: UseMultiResult<"ConversationsList"> = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: "ConversationsList",
    limit: 500,
  });
  const { results: conversations } = conversationsResult;

  // The conversationId need not appear in the sidebar (e.g. if it is a new conversation). If it does,
  // use the conversation from the list to load the title faster, if not, fetch it directly.
  const eagerSelectedConversation = useMemo(() => {
    return conversations?.find((c) => c._id === conversationId);
  }, [conversations, conversationId]);
  const { document: fetchedSelectedConversation } = useSingle({
    documentId: conversationId,
    collectionName: "Conversations",
    fragmentName: "ConversationsList",
    skip: !conversationId,
  });
  const selectedConversation = fetchedSelectedConversation || eagerSelectedConversation;

  const openConversationOptions = () => {
    if (!conversationId) return;

    openDialog({
      componentName: "ConversationTitleEditForm",
      componentProps: {
        documentId: conversationId,
      },
    });
  };

  // Note: we are removing the ability to archive conversations
  // const showArchive = query.showArchive === "true"

  {
    /* <SectionTitle title={title} noTopMargin> */
  }
  {
    /* TODO add mod inbox back in */
  }
  {
    /* {showModeratorLink && <Link to={"/moderatorInbox"} className={classes.modInboxLink}>Mod Inbox</Link>} */
  }
  {
    /* </SectionTitle> */
  }

  const title = selectedConversation
    ? conversationGetTitle2(selectedConversation, currentUser)
    : "No conversation selected";

  return (
    <div className={classes.root}>
      <div className={classNames(classes.column, classes.leftColumn)}>
        <div className={classNames(classes.columnHeader, classes.columnHeaderLeft)}>
          <div className={classes.classes.headerText}>All messages</div>
          <ForumIcon onClick={openNewConversationDialog} icon="PencilSquare" className={classes.actionIcon} />
        </div>
        <div className={classes.navigation}>
          <InboxNavigation2
            conversationsResult={conversationsResult}
            currentUser={currentUser}
            selectedConversationId={conversationId}
            setSelectedConversationId={selectConversationCallback}
          />
        </div>
      </div>
      <div className={classNames(classes.column, classes.rightColumn)}>
        <div className={classNames(classes.columnHeader, classes.columnHeaderRight)}>
          <div className={classes.headerText}>{title}</div>
          {conversationId && (
            <ForumIcon onClick={openConversationOptions} icon="EllipsisVertical" className={classes.actionIcon} />
          )}
        </div>
        <div className={classes.conversation} ref={selectedConversationRef}>
          {selectedConversation ? <>
            <ConversationDetails conversation={selectedConversation} hideOptions />
            <ConversationWidget
              currentUser={currentUser}
              conversation={selectedConversation}
              scrollRef={selectedConversationRef}
            />
          </> : (
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
