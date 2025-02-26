import React from "react"
import { Components, registerComponent } from "../../lib/vulcan-lib/components"
import { styles as metaInfoStyles } from "../common/MetaInfo"
import { isFriendlyUI } from "@/themes/forumTheme";

const styles = (theme: ThemeType) => ({
  root: {
    color: "inherit",
    ...(isFriendlyUI && {
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
    ...metaInfoStyles(theme).root,
    marginLeft: theme.spacing.unit,

    // To properly switch color on item being selected
    ".ck-on &": {
      color: "inherit",
    },
  },
});

const UserMentionHit = ({hit, classes}: {
  hit: SearchUser,
  classes: ClassesType<typeof styles>,
}) => {
  const {MetaInfo, FormatDate, ForumIcon} = Components;
  const icon = isFriendlyUI
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

const UserMentionHitComponent = registerComponent(
  "UserMentionHit",
  UserMentionHit,
  {styles},
);

declare global {
  interface ComponentTypes {
    UserMentionHit: typeof UserMentionHitComponent
  }
}
