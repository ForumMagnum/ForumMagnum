import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { useCurrentUser } from "../common/withUser";
import { textCellStyles } from "./PeopleDirectoryTextCell";
import { formatStat } from "../users/EAUserTooltipContent";
import { CAREER_STAGES } from "@/lib/collections/users/schema";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";
import { userGetProfileUrl } from "@/lib/collections/users/helpers";
import classNames from "classnames";
import moment from "moment";
import UsersProfileImage from "@/components/users/UsersProfileImage";
import NewConversationButton from "@/components/messaging/NewConversationButton";
import ForumIcon from "@/components/common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: 12,
    "&:hover": {
      background: theme.palette.grey[30],
    },
  },
  firstItem: {
    borderTopLeftRadius: theme.borderRadius.default,
    borderTopRightRadius: theme.borderRadius.default,
  },
  lastItem: {
    borderBottomLeftRadius: theme.borderRadius.default,
    borderBottomRightRadius: theme.borderRadius.default,
  },
  borderTop: {
    borderTop: `1px solid ${theme.palette.grey[300]}`,
  },
  main: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  nameSection: {
    flexGrow: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 700,
  },
  createdAt: {
    ...textCellStyles(theme),
    color: theme.palette.grey[600],
    whiteSpace: "nowrap",
  },
  message: {
    marginRight: 8,
    color: theme.palette.grey[600],
    "&:hover": {
      color: theme.palette.grey[1000],
    },
  },
  role: {
    ...textCellStyles(theme),
  },
  bio: {
    ...textCellStyles(theme),
    color: theme.palette.grey[600],
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    height: 19,
    overflow: "hidden",
  },
  stat: {
    ...textCellStyles(theme),
    color: theme.palette.grey[600],
    display: "flex",
    alignItems: "center",
    gap: "4px",
    whiteSpace: "nowrap",
  },
  statIcon: {
    fontSize: 18,
  },
});

const PeopleDirectoryCard = ({user, isFirst, isLast, classes}: {
  user: SearchUser,
  isFirst?: boolean,
  isLast?: boolean,
  classes: ClassesType<typeof styles>,
}) => {
  const currentUser = useCurrentUser();
  const isCurrentUser = user._id === currentUser?._id;

  const {onClick} = useClickableCell({
    href: user ? `${userGetProfileUrl(user)}?from=people_directory` : "#",
    ignoreLinks: true,
    openInNewTab: true,
  });

  const careerStage = user.careerStage?.[0]
    ? CAREER_STAGES.find(({value}) => value === user.careerStage?.[0])
    : null;
  return (
    <div
      onClick={onClick}
      className={classNames(
        classes.root,
        isFirst && classes.firstItem,
        isLast && classes.lastItem,
        !isFirst && classes.borderTop,
      )}
    >
      <div className={classes.main}>
        <UsersProfileImage user={user} size={32} />
        <div className={classes.nameSection}>
          <div className={classes.name}>
            {user.displayName}
          </div>
          <div className={classes.createdAt}>
            Joined {moment(user.createdAt).fromNow()} ago
          </div>
        </div>
        {!isCurrentUser &&
          <InteractionWrapper className={classes.message}>
            <NewConversationButton
              currentUser={currentUser}
              user={user}
              from="people_directory"
              openInNewTab
            >
              <ForumIcon icon="Envelope" />
            </NewConversationButton>
          </InteractionWrapper>
        }
      </div>
      {(user.jobTitle || user.organization) &&
        <div className={classes.role}>
          {user.jobTitle}
          {user.jobTitle && user.organization ? " @ " : ""}
          {user.organization}
        </div>
      }
      {user.bio &&
        <div className={classes.bio}>
          {user.bio}
        </div>
      }
      <div className={classes.meta}>
        <div className={classes.stat}>
          <ForumIcon icon="Star" className={classes.statIcon} />
          {formatStat(user.karma ?? 0)}
        </div>
        {careerStage &&
          <div className={classes.stat}>
            <ForumIcon icon={careerStage.icon} className={classes.statIcon} />
            {careerStage.label}
          </div>
        }
        {user.mapLocationAddress &&
          <div className={classes.stat}>
            <ForumIcon icon="MapPin" className={classes.statIcon} />
            {user.mapLocationAddress}
          </div>
        }
      </div>
    </div>
  );
}

const PeopleDirectoryCardComponent = registerComponent(
  "PeopleDirectoryCard",
  PeopleDirectoryCard,
  {styles},
);

declare global {
  interface ComponentTypes {
    PeopleDirectoryCard: typeof PeopleDirectoryCardComponent
  }
}

export default PeopleDirectoryCardComponent;
