import React, { useMemo } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { htmlToTextDefault } from "../../lib/htmlToText";
import moment from "moment";

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "flex",
    flexDirection: "column",
    width: 270,
    maxWidth: "100%",
    gap: "12px",
    fontSize: 14,
  },
  header: {
    display: "flex",
    maxWidth: "100%",
  },
  headerInfo: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    color: theme.palette.grey[650],
    "& *": {
      whiteSpace: "nowrap",
      textOverflow: "ellipsis",
      overflow: "hidden",
      "&:first-child": {
        fontSize: "1.3rem",
        fontWeight: 600,
        color: theme.palette.grey["A400"],
      },
    },
  },
  profileImage: {
    marginRight: 12,
  },
  role: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 3,
    color: theme.palette.grey[1000],
  },
  bio: {
    overflow: "hidden",
    textOverflow: "ellipsis",
    display: "-webkit-box",
    "-webkit-box-orient": "vertical",
    "-webkit-line-clamp": 5,
    color: theme.palette.grey[600],
  },
  stats: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 1em",
    margin: 4,
  },
  stat: {
    textAlign: "center",
    color: theme.palette.grey[650],
    "& *:first-child": {
      fontSize: 16,
      fontWeight: 600,
      color: theme.palette.grey["A400"],
    },
  },
});

const formatRole = (jobTitle?: string, organization?: string): string =>
  jobTitle && organization
    ? `${jobTitle} @ ${organization}`
    : (jobTitle || organization) ?? "";

const formatBio = (bio?: string): string => htmlToTextDefault(bio ?? "");

const formatStat = (value?: number): string => {
  value ??= 0;
  return value > 10000
    ? `${Math.floor(value / 1000)} ${String(value % 1000).padStart(3, "0")}`
    : String(value);
}

const EAUserTooltipContent = ({user, classes}: {
  user: UsersMinimumInfo,
  classes: ClassesType,
}) => {
  const {
    displayName,
    createdAt,
    jobTitle,
    organization,
    htmlBio,
    karma,
    postCount,
    commentCount,
  } = user;
  const role = formatRole(jobTitle, organization);
  const textBio = useMemo(() => formatBio(htmlBio), [htmlBio]);
  const {UsersProfileImage} = Components;
  return (
    <div className={classes.root}>
      <div className={classes.header}>
        <UsersProfileImage
          user={user}
          size={40}
          className={classes.profileImage}
        />
        <div className={classes.headerInfo}>
          <div>{displayName}</div>
          <div>Joined {moment(createdAt).fromNow()} ago</div>
        </div>
      </div>
      {role &&
        <div className={classes.role}>
          {role}
        </div>
      }
      {textBio &&
        <div className={classes.bio}>
          {textBio}
        </div>
      }
      <div className={classes.stats}>
        <div className={classes.stat}>
          <div>{formatStat(karma)}</div>
          <div>Karma</div>
        </div>
        <div className={classes.stat}>
          <div>{formatStat(postCount)}</div>
          <div>{postCount === 1 ? "Post" : "Posts"}</div>
        </div>
        <div className={classes.stat}>
          <div>{formatStat(commentCount)}</div>
          <div>{commentCount === 1 ? "Comment" : "Comments"}</div>
        </div>
      </div>
    </div>
  );
}

const EAUserTooltipContentComponent = registerComponent(
  "EAUserTooltipContent",
  EAUserTooltipContent,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAUserTooltipContent: typeof EAUserTooltipContentComponent
  }
}
