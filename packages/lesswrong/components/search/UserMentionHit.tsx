import React from "react"
import MetaInfo, { metaInfoRootStyles } from "../common/MetaInfo"
import { isFriendlyUI } from "@/themes/forumTheme";
import FormatDate from "../common/FormatDate";
import ForumIcon from "../common/ForumIcon";
import { defineStyles } from "../hooks/defineStyles";
import { useStyles } from "../hooks/useStyles";

const styles = defineStyles("UserMentionHit", (theme: ThemeType) => ({
  root: {
    color: "inherit",
    ...(theme.isFriendlyUI && {
      display: "block",
      maxWidth: 500,
      overflow: "hidden",
      textOverflow: "ellipsis",
    }),
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: "translateY(4px)",
  },
  userHitLabel: {
    ...theme.typography.body2,
    ...metaInfoRootStyles(theme),
    marginLeft: theme.spacing.unit,

    // To properly switch color on item being selected
    ".ck-on &": {
      color: "inherit",
    },
  },
}));

const UserMentionHit = ({hit}: {
  hit: SearchUser,
}) => {
  const classes = useStyles(styles);
  const icon = isFriendlyUI()
    ? <ForumIcon icon="UserOutline" className={classes.icon} />
    : "👤";
  return <span className={classes.root}>
    {icon} <span>{hit.displayName}</span>
    <MetaInfo className={classes.userHitLabel}>
      <FormatDate date={hit.createdAt} tooltip={false}/>
    </MetaInfo>
    <MetaInfo className={classes.userHitLabel}>
      {hit.karma || 0} karma
    </MetaInfo>
  </span>
}

export default UserMentionHit;


