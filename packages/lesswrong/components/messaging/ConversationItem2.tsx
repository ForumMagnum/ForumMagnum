import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import * as _ from "underscore";
import { truncate } from "../../lib/editor/ellipsize";
import { useClickableCell } from "../common/useClickableCell";
import classNames from "classnames";
import { conversationGetTitle2 } from "../../lib/collections/conversations/helpers";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
    borderBottom: theme.palette.border.grey200,
    cursor: "pointer",
    "&:hover": {
      background: theme.palette.grey[50],
    },
  },
  rootSelected: {
    background: theme.palette.grey[100],
  },
  profileImage: {
    marginRight: 12,
  },
  content: {
    width: "100%"
  },
  titleRow: {
    display: "flex",
    justifyContent: "space-between",
  },
  title: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
    color: theme.palette.grey[1000],
    fontSize: 16,
    fontWeight: 700,
    lineHeight: '21px'
  },
  date: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '21px',
    marginLeft: 4,
    marginRight: 4,
  },
  preview: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '21px',
    marginTop: 2,
  }
});

const ConversationItem2 = ({
  conversation,
  currentUser,
  classes,
  selectedConversationId,
  setSelectedConversationId,
}: {
  conversation: ConversationsList;
  currentUser: UsersCurrent;
  classes: ClassesType;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const { UsersProfileImage, FormatDate } = Components;
  const isSelected = selectedConversationId === conversation._id;

  const { onClick } = useClickableCell({ onClick: () => setSelectedConversationId(conversation._id) });

  if (!conversation) return null;

  const otherParticipants = conversation.participants.filter((u)=> u._id !== currentUser._id)
  // Handle case of conversation with yourself
  const firstParticipant = otherParticipants[0] ?? conversation.participants[0];
  const title = conversationGetTitle2(conversation, currentUser)

  const latestMessagePlaintext = conversation.latestMessage?.contents?.plaintextMainText ?? ""
  // This will be truncated further by webkit-line-clamp. This truncation is just to avoid padding
  // the html with too much junk
  const previewText = truncate(latestMessagePlaintext, 400)

  return (
    <div onClick={onClick} className={classNames(classes.root, {[classes.rootSelected]: isSelected})}>
      <UsersProfileImage
        user={firstParticipant}
        size={40}
        className={classes.profileImage}
      />
      <div className={classes.content}>
        <div className={classes.titleRow}>
          <div className={classes.title}>
            {title}
          </div>
          <div className={classes.date}>
            <FormatDate date={conversation.latestActivity} />
          </div>
        </div>
        <div className={classes.preview}>
          {previewText}
        </div>
      </div>
    </div>
  );
};

const ConversationItem2Component = registerComponent("ConversationItem2", ConversationItem2, { styles });

declare global {
  interface ComponentTypes {
    ConversationItem2: typeof ConversationItem2Component;
  }
}
