import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { textCellStyles } from "./PeopleDirectoryTextCell";
import { InteractionWrapper } from "../common/useClickableCell";
import { useCurrentUser } from "../common/withUser";
import UsersProfileImage from "@/components/users/UsersProfileImage";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import ForumIcon from "@/components/common/ForumIcon";
import LWTooltip from "@/components/common/LWTooltip";

const styles = (theme: ThemeType) => ({
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
});

const PeopleDirectoryUserCell = ({user, classes}: {
  user: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
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

const PeopleDirectoryUserCellComponent = registerComponent(
  "PeopleDirectoryUserCell",
  PeopleDirectoryUserCell,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryUserCell: typeof PeopleDirectoryUserCellComponent
  }
}

export default PeopleDirectoryUserCellComponent;
