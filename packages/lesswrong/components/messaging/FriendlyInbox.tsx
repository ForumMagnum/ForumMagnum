import React, { useCallback, useMemo, useRef } from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib";
import { UseMultiResult, useMulti } from "../../lib/crud/withMulti";
import classNames from "classnames";
import { conversationGetFriendlyTitle } from "../../lib/collections/conversations/helpers";
import { useDialog } from "../common/withDialog";
import { useLocation } from "../../lib/routeUtil";
import type { InboxComponentProps } from "./InboxWrapper";
import { useSingle } from "../../lib/crud/withSingle";
import { userCanDo } from "../../lib/vulcan-users";
import { Link, useNavigate } from "../../lib/reactRouterWrapper";

const MAX_WIDTH = 1100;

const styles = (theme: ThemeType) => ({
  root: {
    height: "100%",
    display: "flex",
    flexDirection: "column",
    width: `min(${MAX_WIDTH}px, 100%)`,
    marginLeft: "auto",
    marginRight: "auto",
    padding: "24px 24px",
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
    flex: 1,
    overflow: "hidden", // to simplify border radius
    border: theme.palette.border.grey200,
    borderRadius: `${theme.borderRadius.default}px ${theme.borderRadius.default}px 0px 0px`,
    [theme.breakpoints.down('xs')]: {
      border: "none",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
  },
  leftColumn: {
    flex: "0 0 360px",
    borderRight: theme.palette.border.grey200,
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
    borderBottom: theme.palette.border.grey200,
    height: "100%",
  },
  conversation: {
    overflowY: "auto",
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderBottom: theme.palette.border.grey200,
    padding: "0px 16px",
    flex: "1 1 auto",
    [theme.breakpoints.down('xs')]: {
      padding: "0px 24px",
    },
  },
  columnHeader: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    borderBottom: theme.palette.border.grey200,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    fontSize: "1.4rem",
    fontWeight: 600,
    padding: 16,
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

const EmptyState = () => {
  return (
    <div>
      <div>You have no open conversations.</div>
    </div>
  );
}

const FriendlyInbox = ({
  currentUser,
  terms,
  conversationId,
  isModInbox = false,
  classes,
}: Omit<InboxComponentProps, "classes"> & {
  conversationId?: string;
  classes: ClassesType<typeof styles>;
}) => {
  const { openDialog } = useDialog();
  const { location } = useLocation();
  const navigate = useNavigate();

  const selectedConversationRef = useRef<HTMLDivElement>(null);

  const selectConversationCallback = useCallback(
    (conversationId: string | undefined) => {
      navigate({ ...location, pathname: `/${isModInbox ? "moderatorInbox" : "inbox"}/${conversationId}` });
    },
    [navigate, isModInbox, location]
  );

  const openNewConversationDialog = useCallback(() => {
    openDialog({
      componentName: "NewConversationDialog",
      componentProps: {
        isModInbox,
      },
    });
  }, [isModInbox, openDialog]);

  const { FriendlyInboxNavigation, ConversationContents, ForumIcon, ConversationDetails } = Components;

  const conversationsResult: UseMultiResult<"ConversationsList"> = useMulti({
    terms,
    collectionName: "Conversations",
    fragmentName: "ConversationsList",
    limit: 500,
  });
  const { results: conversations, loading: conversationsLoading } = conversationsResult;
  const isEmpty = !conversations?.length && !conversationsLoading;

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
    ? conversationGetFriendlyTitle(selectedConversation, currentUser)
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
          <div className={classes.columnHeader}>
            <div className={classes.headerText}>All messages</div>
            <ForumIcon onClick={openNewConversationDialog} icon="PencilSquare" className={classes.actionIcon} />
          </div>
          <div className={classes.navigation}>
            <FriendlyInboxNavigation
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
          {!isEmpty ? (
            <>
              <div className={classes.columnHeader}>
                <div className={classes.headerText}>{title}</div>
                {conversationId ? (
                  <ForumIcon onClick={openConversationOptions} icon="EllipsisVertical" className={classes.actionIcon} />
                ) : (
                  <div className={classes.actionIcon} />
                )}
              </div>
              <div className={classes.conversation} ref={selectedConversationRef}>
                {selectedConversation ? (
                  <>
                    <Link to="/inbox" className={classes.backButton}>
                      Go back to Inbox
                    </Link>
                    <ConversationDetails conversation={selectedConversation} hideOptions />
                    <ConversationContents
                      currentUser={currentUser}
                      conversation={selectedConversation}
                      scrollRef={selectedConversationRef}
                    />
                  </>
                ) : (
                  <></>
                )}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
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
