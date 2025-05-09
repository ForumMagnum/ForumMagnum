import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { truncate } from "../../lib/editor/ellipsize";
import { useClickableCell } from "../common/useClickableCell";
import classNames from "classnames";
import { conversationGetFriendlyTitle } from "../../lib/collections/conversations/helpers";
import { UsersProfileImage } from "../users/UsersProfileImage";
import { FormatDate } from "../common/FormatDate";

const styles = (theme: ThemeType) => ({
  root: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: "12px 12px 12px 16px",
    borderBottom: theme.palette.border.grey200,
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.grey[50],
    },
  },
  rootSelected: {
    // Important to take precendence over unread styles
    background: `${theme.palette.grey[100]} !important`,
  },
  profileImage: {
    marginRight: 12,
  },
  content: {
    width: "100%",
    minWidth: 0,
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  title: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    color: theme.palette.grey[1000],
    fontSize: "1.1rem",
    fontWeight: 600,
    lineHeight: '21px'
  },
  titleUnread: {
    fontWeight: 700,
  },
  date: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    color: theme.palette.grey[600],
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: '21px',
    marginLeft: 4,
    marginRight: 4,
  },
  preview: {
    overflow: "hidden",
    whiteSpace: "nowrap",
    textOverflow: "ellipsis",
    color: theme.palette.grey[600],
    fontSize: "13px",
    fontWeight: 500,
    marginTop: 2,
  },
  previewUnread: {
    color: theme.palette.grey[1000],
    fontWeight: 600,
  },
  unread: {
    width: 8,
    height: 8,
    background: theme.palette.primary.main,
    borderRadius: "50%",
  },
});

const FriendlyConversationItemInner = ({
  conversation,
  currentUser,
  classes,
  selectedConversationId,
  setSelectedConversationId,
}: {
  conversation: ConversationsListWithReadStatus;
  currentUser: UsersCurrent;
  classes: ClassesType<typeof styles>;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const isSelected = selectedConversationId === conversation._id;

  const { onClick } = useClickableCell({ onClick: () => setSelectedConversationId(conversation._id) });

  if (!conversation) return null;

  const otherParticipants = conversation.participants.filter((u)=> u._id !== currentUser._id)
  // Handle case of conversation with yourself
  const firstParticipant = otherParticipants[0] ?? conversation.participants[0];
  const title = conversationGetFriendlyTitle(conversation, currentUser)

  const latestMessagePlaintext = conversation.latestMessage?.contents?.plaintextMainText ?? ""
  // This will be truncated further by webkit-line-clamp. This truncation is just to avoid padding
  // the html with too much junk
  const previewText = truncate(latestMessagePlaintext, 400)
  const {hasUnreadMessages = false} = conversation;

  return (
    <div onClick={onClick} className={classNames(
      classes.root,
      isSelected && classes.rootSelected,
    )}>
      <UsersProfileImage
        user={firstParticipant}
        size={40}
        className={classes.profileImage}
      />
      <div className={classes.content}>
        <div className={classes.titleRow}>
          <div className={classNames(
            classes.title,
            hasUnreadMessages && classes.titleUnread,
          )}>
            {title}
          </div>
          <div className={classes.date}>
            {hasUnreadMessages && <div className={classes.unread} />}
            {conversation.latestActivity && <FormatDate date={conversation.latestActivity} />}
          </div>
        </div>
        <div className={classNames(
          classes.preview,
          hasUnreadMessages && classes.previewUnread,
        )}>
          {previewText}
        </div>
      </div>
    </div>
  );
};

export const FriendlyConversationItem = registerComponent("FriendlyConversationItem", FriendlyConversationItemInner, { styles });


