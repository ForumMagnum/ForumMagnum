import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "@/themes/forumTheme";
import ForumIcon from "../common/ForumIcon";

const styles = (theme: ThemeType) => ({
  root: {
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
});

const TagMentionHit = ({hit, classes}: {
  hit: SearchTag,
  classes: ClassesType<typeof styles>,
}) => {
  const icon = isFriendlyUI
    ? <ForumIcon icon="Tag" className={classes.icon} />
    : "🏷️";
  return (
    <span className={classes.root}>
      {icon} <span>{hit.name}</span>
    </span>
  );
}

export default registerComponent(
  "TagMentionHit",
  TagMentionHit,
  {styles},
);


