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

const PostMentionHit = ({hit, classes}: {
  hit: SearchPost,
  classes: ClassesType<typeof styles>,
}) => {
  const icon = isFriendlyUI
    ? <ForumIcon icon="Document" className={classes.icon} />
    : "📃";
  return (
    <span className={classes.root}>
      {icon} <span>{hit.title}</span>
    </span>
  );
}

export default registerComponent(
  "PostMentionHit",
  PostMentionHit,
  {styles},
);


