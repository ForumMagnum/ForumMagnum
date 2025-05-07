import React from "react";
import { Components } from "../../lib/vulcan-lib/components";
import { textCellStyles } from "./PeopleDirectoryTextCell";
import { InteractionWrapper } from "../common/useClickableCell";
import { useCurrentUser } from "../common/withUser";
import { defineStyles, useStyles } from "../hooks/useStyles";

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
  const {
    UsersProfileImage, NewConversationButton, ForumIcon, LWTooltip,
  } = Components;
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
