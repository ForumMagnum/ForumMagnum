import React from "react";
import { textCellStyles } from "./PeopleDirectoryTextCell";
import { InteractionWrapper } from "../common/useClickableCell";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";
import { UsersProfileImage } from "../users/UsersProfileImage";
import { NewConversationButton } from "../messaging/NewConversationButton";
import { ForumIcon } from "../common/ForumIcon";
import { LWTooltip } from "../common/LWTooltip";

const styles = defineStyles('PeopleDirectoryUserCell', (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    width: "100%",
  },
  name: {
    ...textCellStyles(theme),
    flexGrow: 1,
  },
  message: {
    display: "none", // See `PeopleDirectoryUserCell` for logic to show this
    color: theme.palette.grey[600],
    "&:hover": {
      color: theme.palette.grey[800],
    },
  },
}));

export const PeopleDirectoryUserCell = ({user}: {
  user: SearchUser,
}) => {
  const classes = useStyles(styles);
  const currentUser = useCurrentUser();
  const isCurrentUser = user._id === currentUser?._id;
  return (
    <div className={classes.root}>
      <UsersProfileImage user={user} size={32} />
      <div className={classes.name}>{user.displayName}</div>
      {!isCurrentUser &&
        <InteractionWrapper>
          <LWTooltip title="Send message" placement="bottom">
            <NewConversationButton
              currentUser={currentUser}
              user={user}
              from="people_directory"
              openInNewTab
            >
              <ForumIcon icon="Envelope" className={classes.message} />
            </NewConversationButton>
          </LWTooltip>
        </InteractionWrapper>
      }
    </div>
  );
}
