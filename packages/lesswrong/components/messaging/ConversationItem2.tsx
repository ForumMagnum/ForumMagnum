import React from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import * as _ from "underscore";
import { truncate } from "../../lib/editor/ellipsize";
import { useClickableCell } from "../common/useClickableCell";
import classNames from "classnames";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    backgroundColor: theme.palette.background.pageActiveAreaBackground,
    display: "flex",
    alignItems: "center",
    fontFamily: theme.palette.fonts.sansSerifStack,
    padding: 16,
    borderTop: theme.palette.border.grey200,
    borderLeft: theme.palette.border.grey200,
    borderRight: theme.palette.border.grey200,
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
    color: theme.palette.grey[1000],
    fontSize: 16,
    fontWeight: 700,
    lineHeight: '21px'
  },
  date: {
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '21px'
  },
  preview: {
    overflow: "hidden",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 1,
    // marginTop: 4,
    color: theme.palette.grey[600],
    fontSize: 14,
    fontWeight: 500,
    lineHeight: '21px',
    marginTop: 2,
  }
});

const ConversationItem2 = ({
  conversation,
  updateConversation,
  currentUser,
  classes,
  selectedConversationId,
  setSelectedConversationId,
}: {
  conversation: conversationsListFragment;
  updateConversation: any;
  currentUser: UsersCurrent;
  classes: ClassesType;
  selectedConversationId: string | undefined;
  setSelectedConversationId: React.Dispatch<React.SetStateAction<string | undefined>>;
}) => {
  const { UsersProfileImage, FormatDate, PostsItem2MetaInfo, UsersName } = Components;
  const isArchived = conversation?.archivedByIds?.includes(currentUser._id);
  const isSelected = selectedConversationId === conversation._id;

  const { onClick } = useClickableCell({ onClick: () => setSelectedConversationId(conversation._id) });

  if (!conversation) return null;

  const otherParticipants = conversation.participants.filter((u)=> u._id !== currentUser._id)
  const firstParticipant = otherParticipants[0];
  const title = `${firstParticipant.displayName}${
    otherParticipants.length > 1 ? ` + ${otherParticipants.length - 1} more` : ""
  }`;

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
          {/* {conversation.latestMessage.contents.plain} */}
          {previewText}
        </div>
      </div>
    </div>
  );
  // return (
  //   <div>
  //     <div className={classNames(classes.root, classes.wrap, { [classes.archivedItem]: isArchived })}>
  //       <div
  //         className={classNames(classes.title, classes.titleLineHeight, classes.commentFont)}
  //         onClick={() => setSelectedConversationId(conversation._id)}
  //       >
  //         {conversationGetTitle(conversation, currentUser)}
  //       </div>
  //       {conversation.participants
  //         .filter((user) => user._id !== currentUser._id)
  //         .map((user) => (
  //           <span key={user._id} className={classes.leftMargin}>
  //             <PostsItem2MetaInfo>
  //               {" "}
  //               <UsersName user={user} />{" "}
  //             </PostsItem2MetaInfo>
  //           </span>
  //         ))}
  //       {conversation.latestActivity && (
  //         <span className={classes.leftMargin}>
  //           <PostsItem2MetaInfo>
  //             <FormatDate date={conversation.latestActivity} />
  //           </PostsItem2MetaInfo>
  //         </span>
  //       )}
  //     </div>
  //   </div>
  // );
};

const ConversationItem2Component = registerComponent("ConversationItem2", ConversationItem2, { styles });

declare global {
  interface ComponentTypes {
    ConversationItem2: typeof ConversationItem2Component;
  }
}
