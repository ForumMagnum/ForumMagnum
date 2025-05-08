import React from "react";
import { Components, registerComponent } from "../../lib/vulcan-lib/components";
import { isFriendlyUI } from "@/themes/forumTheme";

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

const PostMentionHitInner = ({hit, classes}: {
  hit: SearchPost,
  classes: ClassesType<typeof styles>,
}) => {
  const icon = isFriendlyUI
    ? <Components.ForumIcon icon="Document" className={classes.icon} />
    : "📃";
  return (
    <span className={classes.root}>
      {icon} <span>{hit.title}</span>
    </span>
  );
}

export const PostMentionHit = registerComponent(
  "PostMentionHit",
  PostMentionHitInner,
  {styles},
);

declare global {
  interface ComponentTypes {
    PostMentionHit: typeof PostMentionHit
  }
}
