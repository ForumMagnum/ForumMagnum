import React from "react"
import FormatDate from "../common/FormatDate";
import { defineStyles, useStyles } from "../hooks/useStyles";
import MetaInfo from "../common/MetaInfo";

const styles = defineStyles("UserMentionHit", (theme: ThemeType) => ({
  root: {
    color: "inherit"
  },
  icon: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: "translateY(4px)",
  },
  userHitLabel: {
    ...theme.typography.body2,
    display: "inline",
    color: theme.palette.grey[600],
    marginRight: 8,
    fontSize: "1rem",
    marginLeft: 8,

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
  const icon = "👤";
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
