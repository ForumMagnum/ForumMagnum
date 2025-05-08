import React from "react";
import { registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "@/themes/forumTheme";
import { ForumIcon } from "../common/ForumIcon";

const styles = () => ({
  root: {
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
});

const TagMentionHitInner = ({hit, classes}: {
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

export const TagMentionHit = registerComponent(
  "TagMentionHit",
  TagMentionHitInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    TagMentionHit: typeof TagMentionHit
  }
}
