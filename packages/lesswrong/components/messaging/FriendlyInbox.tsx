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
import { userCanDo } from "../../lib/vulcan-users";
import { Link } from "../../lib/reactRouterWrapper";

const MAX_WIDTH = 1100;

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "32px 32px 0px 32px",
    zIndex: theme.zIndexes.singleColumnSection,
    [theme.breakpoints.down('xs')]: {
      padding: 0,
      minHeight: "100%",
      height: "auto",
    },
  },
  modInboxLink: {
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    width: 'fit-content',
    padding: "12px 12px 8px 16px",
    fontWeight: 600,
  },
  backButton: {
    ...theme.typography.body2,
    color: theme.palette.lwTertiary.main,
    width: 'fit-content',
    padding: "12px 0 0 0",
    fontWeight: 600,
    display: "none",
    // Only show on mobile
    [theme.breakpoints.down('xs')]: {
      display: "block",
    }
  },
  table: {
    minHeight: 0,
    display: "flex",
    flexDirection: "row",
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  leftColumn: {
    flex: "0 0 360px",
    maxWidth: 360,
    [theme.breakpoints.down('sm')]: {
      flex: "0 0 280px",
      maxWidth: 280,
    },
    [theme.breakpoints.down('xs')]: {
      flex: "1 1 auto",
      maxWidth: "100%",
    },
  },
  rightColumn: {
    flex: "1 1 auto",
  },
  hideColumnSm: {
    [theme.breakpoints.down('xs')]: {
      display: "none",
    },
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
    [theme.breakpoints.down('xs')]: {
      padding: "0px 24px",
    },
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
    [theme.breakpoints.down('xs')]: {
      borderTopLeftRadius: 0,
    },
  },
  columnHeaderRight: {
    borderLeft: "none",
    borderTopRightRadius: theme.borderRadius.default,
    [theme.breakpoints.down('xs')]: {
      borderTopRightRadius: 0,
      borderrRight: "none",
    },
  },
  headerText: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
    [theme.breakpoints.down('xs')]: {
      "-webkit-line-clamp": 2,
    }
  },
  actionIcon: {
    color: theme.palette.grey[600],
    width: 24,
    height: 24,
    cursor: "pointer",
  }
});

const FriendlyInbox = ({
  currentUser,
  terms,
  conversationId,
  isModInbox = false,
  classes,
}: InboxComponentProps & {
  conversationId?: string;
}) => {
  const { openDialog } = useDialog();
  const { currentRoute, location } = useLocation();
  const { history } = useNavigation();

  const selectedConversationRef = useRef<HTMLDivElement>(null);

  const selectConversationCallback = useCallback(
    (conversationId: string | undefined) => {
      history.push({ ...location, pathname: `/${isModInbox ? "moderatorInbox" : "inbox"}/${conversationId}` });
    },
    [history, isModInbox, location]
  );

  const openNewConversationDialog = useCallback(() => {
    openDialog({
      componentName: "NewConversationDialog",
      componentProps: {
        isModInbox,
      },
    });
  }, [isModInbox, openDialog]);

  const { InboxNavigation2, ConversationWidget, ForumIcon, ConversationDetails, Typography } = Components;

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

  const showModeratorLink = userCanDo(currentUser, 'conversations.view.all') && !isModInbox;

  const title = selectedConversation
    ? conversationGetTitle2(selectedConversation, currentUser)
    : "No conversation selected";

  return (
    <div className={classes.root}>
      {showModeratorLink && (
        <Link to={"/moderatorInbox"} className={classes.modInboxLink}>
          Mod Inbox
        </Link>
      )}
      <div className={classes.table}>
        <div
          className={classNames(classes.column, classes.leftColumn, {
            [classes.hideColumnSm]: conversationId,
          })}
        >
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
        <div
          className={classNames(classes.column, classes.rightColumn, {
            [classes.hideColumnSm]: !conversationId,
          })}
        >
          <div className={classNames(classes.columnHeader, classes.columnHeaderRight)}>
            <div className={classes.headerText}>{title}</div>
            {conversationId && (
              <ForumIcon onClick={openConversationOptions} icon="EllipsisVertical" className={classes.actionIcon} />
            )}
          </div>
          <div className={classes.conversation} ref={selectedConversationRef}>
            {selectedConversation ? (
              <>
                <Link to="/inbox" className={classes.backButton}> Go back to Inbox </Link>
                <ConversationDetails conversation={selectedConversation} hideOptions />
                <ConversationWidget
                  currentUser={currentUser}
                  conversation={selectedConversation}
                  scrollRef={selectedConversationRef}
                />
              </>
            ) : (
              <></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FriendlyInboxComponent = registerComponent("FriendlyInbox", FriendlyInbox, { styles });

declare global {
  interface ComponentTypes {
    FriendlyInbox: typeof FriendlyInboxComponent;
  }
}
